(function () {

    var cardWraps = document.getElementsByClassName('poke-card-wrap'),
        startUrl = '/api/v1/pokemon/?limit=12',
        nextUrl = '',
        cardsData = [],
        detailCard = document.getElementById('poke-detail-card'),
        detailCardWidth,
        filtersWrap = document.getElementsByClassName('filter-helpers')[0],
        loadMoreWrap = document.getElementById('load-more-wrap'),
        mainSection = document.getElementById('main'),
        filters = [],
        compiledCardTmpl,
        compiledDetailTmpl,
        compiledFilterTmpl;


    document.addEventListener("DOMContentLoaded", function() {
        getData(startUrl);

        var cardTmpl  = document.getElementById('card-tmpl').innerHTML,
            detailTmpl  = document.getElementById('detail-tmpl').innerHTML,
            filterTmpl  = document.getElementById('filter-tmpl').innerHTML;

        compiledCardTmpl = Handlebars.compile(cardTmpl);
        compiledDetailTmpl = Handlebars.compile(detailTmpl);
        compiledFilterTmpl = Handlebars.compile(filterTmpl);

        detailCardWidth = detailCard.offsetWidth;
    });

    document.getElementById('poke-list').addEventListener('click', function(e){

        var classStr = e.target.className;

        if (classStr.match('type') && !classStr.match('type' + 's') ) {
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
    });

    document.getElementById('load-more').addEventListener('click', function(){
        for (var i = 0; i < cardWraps.length; i++) {
            cardWraps[i].className = cardWraps[i].className.replace(/fade-\w{2,3}/g, '');
        }
        var badges = filtersWrap.getElementsByClassName('filter-item');
        for (var i = 0; i < filters.length; i++) {
            removeElement(badges[0]);
        }
        filters = [];
        filtersWrap.style.display = 'none';
        getData(nextUrl);
    });

    filtersWrap.addEventListener('click', function(e){
        var deleteType = '';
        if (e.target.className == 'filter-delete') {
            deleteType = e.target.closest('.filter-item').className.replace('filter-item type-', '');
            filterByType(deleteType, true);
        }
        return false;
    });



    function filterByType(filterType, isRemove) {

        if (typeof isRemove === 'undefined') {
            isRemove = false;
        }

        if (filters.join().match(filterType) && !isRemove) {
            return;
        }

        if (isRemove) {
            filters = filters.filter(function(type){
                return type !== filterType;
            });
            removeElement(filtersWrap.getElementsByClassName('type-' + filterType)[0]);
        } else {
            filters.push(filterType);
            filtersWrap.innerHTML += compiledFilterTmpl({type: filterType});
        }

        if (!filters.length && filtersWrap.style.display === 'block') {
            filtersWrap.style.display = 'none';
        } else {
            filtersWrap.style.display = 'block';
        }

        for (var i = 0; i < cardWraps.length; i++) {
            cardWraps[i].className = cardWraps[i].className.replace(/fade-\w{2,3}/g, '');

            var matches = 0;
            filters.forEach(function(type){
                if (cardWraps[i].getElementsByClassName('type-' + type).length !== 0) {
                    matches++;
                }
            });

            if (matches === filters.length) {
                cardWraps[i].className += ' fade-in';
            } else {
                cardWraps[i].className += ' fade-out';
            }
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

        detailCard.innerHTML = detailHTML;

        var zeros = '';

        if (pokeID.length === 1) {
            zeros = '00';
        } else if (pokeID.length === 2) {
            zeros = '0';
        }
        detailCard.getElementsByClassName('detail-id')[0].innerHTML = '#' + zeros + pokeID;

    }



    function app(pokeData) {

        cardsData = cardsData.concat(pokeData.objects);
        if (pokeData.meta.next) {
            nextUrl = pokeData.meta.next;
        } else {
            loadMoreWrap.innerHTML = '<pre>It is all ¯\\_(ツ)_/¯</pre>';
        }

        var listHTML = '';

        for (var i = 0; i < pokeData.objects.length; i++) {
            listHTML += compiledCardTmpl(pokeData.objects[i])
        }

        document.getElementById('poke-list').innerHTML += listHTML;

        loadMoreWrap.style.display = 'block';
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

    function removeElement(element) {
        element && element.parentNode && element.parentNode.removeChild(element);
    }

    function centerDetailCard() {
        console.log(detailCard.getBoundingClientRect());
    }

    window.onscroll = throttle(function (event) {
        var scrolled = window.pageYOffset || document.documentElement.scrollTop;
        if (scrolled > mainSection.offsetTop) {
            detailCard.style.position = 'fixed';
            detailCard.style.width = detailCardWidth + 'px';
        } else {
            detailCard.style.position = 'absolute';
        }
    }, 16);


     /*   function() {
        /!*var scrolled = window.pageYOffset || document.documentElement.scrollTop;
         document.getElementById('showScroll').innerHTML = scrolled + 'px';*!/
        var scrolled;
        if (detailCard.getBoundingClientRect().top < 0) {
            scrolled = window.pageYOffset || document.documentElement.scrollTop;
            detailCard.style.top = scrolled - mainSection.offsetTop + 'px';
        } else {
            detailCard.style.top = '0px';
        }

        /!*throttle*!/
        console.log(mainSection.offsetTop);
    }
*/

    function throttle(fn, threshhold, scope) {
        threshhold || (threshhold = 250);
        var last,
            deferTimer;
        return function () {
            var context = scope || this;

            var now = +new Date,
                args = arguments;
            if (last && now < last + threshhold) {
                // hold on to it
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function () {
                    last = now;
                    fn.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                fn.apply(context, args);
            }
        };
    }

})();