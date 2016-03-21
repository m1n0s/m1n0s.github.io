(function () {

    var cardWraps = document.getElementsByClassName('poke-card-wrap'),
        startUrl = '/api/v1/pokemon/?limit=12',
        nextUrl = '',
        cardsData = [],
        compiledCardTmpl,
        compiledDetailTmpl;


    document.addEventListener("DOMContentLoaded", function() {
        getData(startUrl);

        var cardTmpl  = document.getElementById('card-tmpl').innerHTML,
            detailTmpl  = document.getElementById('detail-tmpl').innerHTML;

        compiledCardTmpl = Handlebars.compile(cardTmpl);
        compiledDetailTmpl = Handlebars.compile(detailTmpl);
    });

    document.getElementById('poke-list').addEventListener('click', function(e){

        var classStr = e.target.className;

        if (classStr.match('type') && !classStr.match('type' + 's')) {
            filterByType(e.target.innerHTML.toLowerCase());
            return false;
        }

        var cardWrap = e.srcElement.closest('.poke-card-wrap');

        if (cardWrap) {
            var podkeID = cardWrap.getElementsByClassName('poke-card')[0].id.replace('poke-', '');
            showDetails(podkeID);
            return false;
        }

        e.preventDefault();
        e.stopPropagation();

    }, false);

    document.getElementById('load-more').addEventListener('click', function(){

        getData(nextUrl);

    }, false);

    function filterByType(filterType) {
        var labels = document.getElementsByClassName('type-' + filterType);

        for (var i = 0; i < cardWraps.length; i++) {
            cardWraps[i].className = cardWraps[i].className.replace(/fade-\w\w\w?/, '');
            cardWraps[i].className += ' fade-out';
        }

        for (var i = 0; i < labels.length; i++) {
            labels[i].closest('.poke-card-wrap').className = labels[i].closest('.poke-card-wrap').className.replace('fade-out', 'fade-in');
        }
    }

    function showDetails(pokeID) {

        var detailHTML = '';

        for (var i = 0; i < cardsData.length; i++) {
            if (cardsData[i].pkdx_id == pokeID) {
                detailHTML = compiledDetailTmpl(cardsData[i]);
                break;
            }
        }

        document.getElementById('poke-detail-card').innerHTML = detailHTML;

        var zeros = '';

        if (pokeID.length === 1) {
            zeros = '00';
        } else if (pokeID.length === 2) {
            zeros = '0';
        }
        document.getElementsByClassName('detail-id')[0].innerHTML = '#' + zeros + pokeID;

    }



    function app(pokeData) {

        cardsData = cardsData.concat(pokeData.objects);
        nextUrl = pokeData.meta.next;

        var listHTML = '';

        for (var i = 0; i < pokeData.objects.length; i++) {
            listHTML += compiledCardTmpl(pokeData.objects[i])
        }

        document.getElementById('poke-list').innerHTML += listHTML;
    }

    function getData(url) {
        fetch('http://pokeapi.co' + url)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                app(data);
            })
            .catch(function(error) {
                console.log(error);
            });
    }

})();