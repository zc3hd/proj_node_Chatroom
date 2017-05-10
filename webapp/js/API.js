(function($) {
  function API() {};
  API.prototype = {
    sign_in:function (obj) {
      return $.ajax({
        url: "/sign_in",
        dataType: "json",
        type: "post",
        data: obj,
      });
    },
  };
  window.API = API;
})(jQuery);