(function () {

    var startUrl = '/api/v1/pokemon/?limit=',
        nextUrl = '',
        cardsData = [],
        limitForm = document.getElementById('limit-size'),
        limitInput = document.getElementById('limit-count'),
        mainSection = document.getElementById('main'),
        headerSection = document.getElementById('main-header'),
        greetingSection = document.getElementById('greeting'),
        pokeList = document.getElementById('poke-list'),
        cardWraps = document.getElementsByClassName('poke-card-wrap'),
        detailCard = document.getElementById('poke-detail-card'),
        loadMoreWrap = document.getElementById('load-more-wrap'),
        loadMoreBtn = document.getElementById('load-more'),
        detailID,
        filtersWrap = mainSection.getElementsByClassName('filter-helpers')[0],
        loadMoreLoader = mainSection.getElementsByClassName('poke-loader')[0],
        headerHeight,
        detailCardWidth,
        filters = [],
        compiledCardTmpl,
        compiledDetailTmpl,
        compiledFilterTmpl,
        typeClass = 'type',
        cardClass = 'poke-card';

    /* Event Listeners */

    document.addEventListener("DOMContentLoaded", function() {

        loadMoreBtn.style.display = 'none';
        loadMoreLoader.style.display = 'inline';
        loadMoreLoader.style.display = 'none';
        mainSection.style.display = 'none';

        headerHeight = headerSection.offsetHeight;

        //greetingSection.style.paddingTop = headerHeight + 'px';
        greetingSection.style.marginTop = -headerHeight + 'px';

        //getData(startUrl);

        var cardTmpl  = document.getElementById('card-tmpl').innerHTML,
            detailTmpl  = document.getElementById('detail-tmpl').innerHTML,
            filterTmpl  = document.getElementById('filter-tmpl').innerHTML;

        compiledCardTmpl = Handlebars.compile(cardTmpl);
        compiledDetailTmpl = Handlebars.compile(detailTmpl);
        compiledFilterTmpl = Handlebars.compile(filterTmpl);
    });

    limitForm.addEventListener('submit', function(e) {

        greetingSection.style.display = 'none';
        mainSection.style.display = 'block';

        detailCardWidth = detailCard.parentNode.offsetWidth - 30;

        getData(startUrl += limitInput.value);

        e.stopPropagation();
        e.preventDefault();
    });

    pokeList.addEventListener('click', function(e){

        var classStr = e.target.className;

        if (classStr.match(typeClass) && !classStr.match(typeClass + 's') ) {
            filterByType(e.target.innerHTML.toLowerCase());
            return false;
        }

        var cardWrap = e.srcElement.closest('.' + cardClass + '-wrap');

        if (cardWrap) {
            var podkeID = cardWrap.getElementsByClassName(cardClass)[0].id.replace('poke-', '');
            showDetails(podkeID);
            return false;
        }

        e.preventDefault();
        e.stopPropagation();
    });

    loadMoreBtn.addEventListener('click', function(){
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
    });

    window.onscroll = throttle(function (event) {
        var scrolled = window.pageYOffset || document.documentElement.scrollTop;
        if (scrolled > mainSection.offsetTop) {
            detailCard.style.position = 'fixed';
            detailCard.style.width = detailCardWidth + 'px';
        } else {
            detailCard.style.position = 'absolute';
        }
    }, 16);

    window.onresize = throttle(function (event) {
        detailCardWidth = detailCard.parentNode.offsetWidth - 30;
    }, 16);

    /* Functions */

    function app(pokeData) {

        loadMoreBtn.style.display = 'inline-block';
        loadMoreLoader.style.display = 'none';

        cardsData = cardsData.concat(pokeData.objects);
        if (pokeData.meta.next) {
            nextUrl = pokeData.meta.next;
        } else {
            loadMoreWrap.innerHTML = '<pre>That\'s all ¯\\_(ツ)_/¯</pre>';
        }

        var listHTML = '';

        for (var i = 0; i < pokeData.objects.length; i++) {
            listHTML += compiledCardTmpl(pokeData.objects[i])
        }

        pokeList.innerHTML += listHTML;
    }

    function getData(url) {

        loadMoreBtn.style.display = 'none';
        loadMoreLoader.style.display = 'inline';

        fetch('http://pokeapi.co' + url)
            .then(function(response) {
                return response.json();
            })
            .then(function(data) {
                app(data);
            })
            .catch(function(error) {
                alert('Sorry, something went wrong. Please try again later.');
            });
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
        detailID = document.getElementById('detail-id');

        if (pokeID.length === 1) {
            zeros = '00';
        } else if (pokeID.length === 2) {
            zeros = '0';
        }

        detailID.innerHTML = '#' + zeros + pokeID;

    }

    function filterByType(filterType, isRemove) {

        if (typeof isRemove === 'undefined') {
            isRemove = false;
        }

        if (!isRemove && filters.join().match(filterType)) {
            return;
        }

        if (isRemove) {
            filters = filters.filter(function(type){
                return type !== filterType;
            });
            removeElement(filtersWrap.getElementsByClassName(typeClass + '-' + filterType)[0]);
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
                if (cardWraps[i].getElementsByClassName(typeClass + '-' + type).length !== 0) {
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


    /* Next code here were stolen from WWW */

    function removeElement(element) {
        element && element.parentNode && element.parentNode.removeChild(element);
    }

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