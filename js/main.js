(function () {
    document.addEventListener("DOMContentLoaded", function() {
        console.log('Your document is ready!');

        fetch('http://pokeapi.co/api/v1/pokemon/?limit=12')
            .then(function(response) {
                //alert(response.headers.get('Content-Type')); // application/json; charset=utf-8
                //alert(response.status); // 200

                return response.json();
            })
            .then(function(data) {
                console.log(data.objects[0].name);
            })
            .catch(function(error) {
                alert('fuck' + error)
            });
    });
})();