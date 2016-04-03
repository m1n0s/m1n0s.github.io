(function () {

    'use strict';

    const limitForm = document.getElementById('limit-size'),
        limitInput = document.getElementById('limit-count'),
        mainSection = document.getElementById('main'),
        headerSection = document.getElementById('main-header'),
        greetingSection = document.getElementById('greeting'),
        pokeList = document.getElementById('poke-list'),
        cardWraps = document.getElementsByClassName('poke-card-wrap'),
        detailCard = document.getElementById('poke-detail-card'),
        loadMoreWrap = document.getElementById('load-more-wrap'),
        loadMoreBtn = document.getElementById('load-more'),
        filtersBadges = document.getElementById('filters-badges'),
        filterRuleWrap = document.getElementById('toggle-switch'),
        filterRuleCheckbox = document.getElementById('filter-rule'),
        inputHelper = document.getElementById('helper'),
        filtersWrap = mainSection.getElementsByClassName('filter-helpers')[0],
        loadMoreLoader = mainSection.getElementsByClassName('poke-loader')[0],
        typeClass = 'type',
        cardClass = 'poke-card',

        /* helpers functions */

        hide = el => el.style.display ='none',
        show = el => el.style.display ='block',
        isShown = el => el.style.display !== 'none',
        showInlineBlock = el => el.style.display ='inline-block',
        removeElement = el => el && el.parentNode && el.parentNode.removeChild(el);

    let startUrl = '/api/v1/pokemon/?limit=',
        nextUrl = '',
        cardsData = [],
        filterRule = true, /* true = all | false = any */
        isFetching = false,
        detailID,
        headerHeight,
        detailCardWidth,
        filters = [],
        compiledCardTmpl,
        compiledDetailTmpl,
        compiledFilterTmpl;


    /* Functions */

    const
        app = pokeData => {

            showInlineBlock(loadMoreBtn);
            hide(loadMoreLoader);

            cardsData = cardsData.concat(pokeData.objects);
            if (pokeData.meta.next) {
                nextUrl = pokeData.meta.next;
            } else {
                loadMoreWrap.innerHTML = '<pre>That\'s all ¯\\_(ツ)_/¯</pre>';
            }

            let listHTML = '';

            for (let i = 0; i < pokeData.objects.length; i++) {
                listHTML += compiledCardTmpl(pokeData.objects[i]);
            }

            pokeList.innerHTML += listHTML;
        },
        getData = url => {

            /* for preventing filtering during fetching */
            isFetching = true;

            hide(loadMoreBtn);
            showInlineBlock(loadMoreLoader);

            fetch('http://pokeapi.co' + url)
                .then(response => response.json())
                .then(data => {
                    isFetching = false;
                    app(data);
                })
                .catch(error => {
                    alert('There has been a problem with your fetch operation: ' + error.message);
                });
        },
        showDetails = pokeID => {

            let detailHTML = '',
                zeros = '000'.slice(0, -pokeID.length);

            for (let i = 0; i < cardsData.length; i++) {
                if (cardsData[i].pkdx_id == pokeID) {
                    detailHTML = compiledDetailTmpl(cardsData[i]);
                    break;
                }
            }

            detailCard.innerHTML = detailHTML;
            detailID = document.getElementById('detail-id');
            detailID.innerHTML = '#' + zeros + pokeID;

        },
        filterByType = (filterType, isRemove) => {

            isRemove = (typeof isRemove === 'undefined') ? false : isRemove;

            if (isFetching || !isRemove && filterType && filters.join().match(filterType)) {
                return;
            }

            if (isRemove) {

                filters = filters.filter(type =>type !== filterType);

                removeElement(filtersBadges.getElementsByClassName(typeClass + '-' + filterType)[0]);

            } else if (filterType) {

                filters.push(filterType);
                filtersBadges.innerHTML += compiledFilterTmpl({type: filterType});
            }

            let filtersCount = filters.length;

            (!filtersCount && isShown(filtersWrap)) ? hide(filtersWrap) : show(filtersWrap);

            (filtersCount > 1) ? showInlineBlock(filterRuleWrap) : hide(filterRuleWrap);

            if (filtersCount) {

                for (let i = 0; i < cardWraps.length; i++) {

                    cardWraps[i].classList.remove('fade-in', 'fade-out');

                    let matches = 0;
                    filters.forEach(type => {
                        if (cardWraps[i].getElementsByClassName(typeClass + '-' + type).length !== 0) {
                            matches++;
                        }
                    });

                    /* true = all | false = any */
                    if (filterRule) {
                        cardWraps[i].classList.add((matches === filtersCount) ? 'fade-in' : 'fade-out');
                    } else {
                        cardWraps[i].classList.add((matches !== 0) ? 'fade-in' : 'fade-out');
                    }
                }
            } else {
                for (let i = 0; i < cardWraps.length; i++) {
                    cardWraps[i].classList.remove('fade-in', 'fade-out');
                }
            }
        };


    /* Event Listeners */

    document.addEventListener("DOMContentLoaded", () => {
        headerHeight = headerSection.offsetHeight;

        greetingSection.style.marginTop = -.1 * headerHeight + 'rem';

        const cardTmpl = document.getElementById('card-tmpl').innerHTML,
            detailTmpl = document.getElementById('detail-tmpl').innerHTML,
            filterTmpl = document.getElementById('filter-tmpl').innerHTML;

        compiledCardTmpl = Handlebars.compile(cardTmpl);
        compiledDetailTmpl = Handlebars.compile(detailTmpl);
        compiledFilterTmpl = Handlebars.compile(filterTmpl);
    });

    filterRuleCheckbox.addEventListener('change', function () {
        filterRule = this.checked;
        filterByType();
    });

    limitForm.addEventListener('submit', function (e) {

        let val = limitInput.value;

        if (!val) {
            inputHelper.textContent = 'Please fill your count.';
            e.preventDefault();
            return;
        }

        if (!val.match(/^\d+$/)) {
            inputHelper.textContent = 'Only numbers will pass.';
            e.preventDefault();
            return;
        }

        hide(greetingSection);
        show(mainSection);

        detailCardWidth = detailCard.parentNode.offsetWidth;

        getData(startUrl += limitInput.value);

        e.preventDefault();
    });

    pokeList.addEventListener('click', function (e) {

        let classList = e.target.classList;

        if (classList.contains(typeClass)) {
            filterByType(e.target.innerHTML.toLowerCase());
            return false;
        }

        let cardWrap = e.target.closest('.' + cardClass + '-wrap');

        if (cardWrap) {
            let pokeID = cardWrap.getElementsByClassName(cardClass)[0].id.replace('poke-', '');
            showDetails(pokeID);
            return false;
        }

        e.preventDefault();
        e.stopPropagation();
    });

    loadMoreBtn.addEventListener('click', function () {

        /* Clear filters before get new chunk of data */
        for (let i = 0; i < cardWraps.length; i++) {
            cardWraps[i].classList.remove('fade-in', 'fade-out');
        }
        filtersBadges.innerHTML = '';
        filters = [];
        hide(filtersWrap);

        getData(nextUrl);
    });

    filtersBadges.addEventListener('click', function (e) {
        if (e.target.classList.contains('filter-delete')) {
            let deleteType = e.target.parentNode.textContent.substring(2);
            filterByType(deleteType, true);
        }
    });

    window.addEventListener('scroll', throttle(() => {
            let scrolled = window.pageYOffset || document.documentElement.scrollTop;
            if (scrolled > mainSection.offsetTop) {
<<<<<<< HEAD
                detailCard.classList.add('pos-fixed');
                detailCard.style.width = detailCardWidth + 'px';
            } else {
                detailCard.classList.remove('pos-fixed');
=======
                detailCard.style.position = 'fixed';
                detailCard.style.width = .1*detailCardWidth + 'rem';
            } else {
                detailCard.style.position = 'absolute';
                detailCard.style.width = .1*detailCardWidth + 'rem';
>>>>>>> origin/master
            }
        }, 16)
    );

    window.addEventListener('resize', throttle(() => {
            detailCardWidth = detailCard.parentNode.offsetWidth;
            detailCard.style.width = .1*detailCardWidth + 'rem';
        }, 16)
    );


    /* Next code here was stolen from WWW */

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