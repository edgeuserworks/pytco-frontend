'use strict';

var module = angular.module('pytco.aws', []);

module.service('CloudFront', [
  '$http',
  CloudFront
]);

function CloudFront ($http) {

  // This gets replaced at build time by our grunt-replace task.
  var baseUrl = "CLOUDFRONT_URL";
  this.baseUrl = baseUrl;

  var distribution = [];

  function index (options) {
    return new Promise(function (resolve, reject) {
      if (distribution.length > 0) return resolve();

      $http.get(baseUrl, options)
      .then(
        function (resp) {
          var parser = new window.DOMParser();
          var d = parser.parseFromString(resp.data, "text/xml");

          var listBucketResult = d.documentElement;
          var contents = listBucketResult.getElementsByTagName('Contents');

          // TODO: handle d.isTruncated = true

          for (var c = 0; c < contents.length; c++) {
            var content = contents[c].getElementsByTagName('Key');
            var k = content[0].childNodes[0].nodeValue;

            // Don't index directory keys
            if (k.slice(-1) === "/") continue;

            // Don't duplicate keys in index
            if (distribution.indexOf(k) > -1) return;

            distribution.push(k);
          }

          resolve();
        },
        function (err) {
          reject(err);
        }
      );
    });
  };

  this.get = function (prefix) {
    return new Promise(function (resolve, reject) {
      index({cache: true})
      .then(function () {
        var filtered = distribution.filter(function (e) {
          return e.indexOf(prefix) == 0;
        });

        resolve(filtered);
      })
      .catch(function (err) {
        reject(err);
      })
    });
  };

  // getJson fetches json payload with the provided key from CloudFront.
  this.getJson = function (key) {
      return new Promise(function (resolve, reject) {
          var url = baseUrl + '/' + key;

          $http.get(url, {cache: true})
          .then(
              function (resp) {
                  resolve(resp.data);
              },
              function (err) {
                  reject(err);
              }
          );
      })
  }
}
