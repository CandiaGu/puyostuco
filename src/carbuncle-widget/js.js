import jQuery from 'jquery';
import 'jquery.easing';

jQuery(($) => {
  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  // a list of available css animations
  const animations = ['raise-hands',
    'flap-ears',
    'turn-around',
    'open-mouth',
    'compress', 'compress-stretch',
    'dance-open-mouth-fast', 'dance-open-mouth-slow',
    'swing-butt',
    'dance',
    'yawn',
    'lick',
    'sleep',
    'doze-off',
    'kick-right', 'kick-left',
    'walk-right', 'walk-left',
    'slide-right', 'slide-left',
    'stretch-legs',
    'squat',
    'low-jump', 'high-jump',
  ];

  const $carbyBox = $('.carby-box');
  const $carby = $('.carby', $carbyBox);

  // defines extra mutating animations(e.g. translations) that plays with the css animations
  const animationBehaviors = ((() => {
    const px2em = function (px) {
      // assuming 'font-size' return a pixel value, e.g. '10px'
      const pxPerEm = +$carbyBox.css('font-size').slice(0, -2);
      return px / pxPerEm;
    };

    const stepFn = function (emPerMovement, clampTo) {
      return (_, tween) => {
        // eslint-disable-next-line no-param-reassign
        tween.now = Math.floor(clamp(tween.now, 0, clampTo) / emPerMovement) * emPerMovement;
      };
    };
    const maxX = () => px2em(window.innerWidth - $carbyBox.width());
    const maxY = () => px2em(window.innerHeight - $carbyBox.height());

    return {
      'walk-right': function () {
        $carbyBox
          .delay(0.15e3)
          .animate({ left: '+=16em' },
            {
              duration: 1.5e3 - 0.15e3,
              easing: 'linear',
              step: stepFn(1, maxX()),
            });
      },
      'walk-left': function () {
        $carbyBox
          .delay(0.15e3)
          .animate({ left: '-=16em' },
            {
              duration: 1.5e3 - 0.15e3,
              easing: 'linear',
              step: stepFn(1, maxX()),
            });
      },
      'slide-right': function () {
        $carbyBox
          .delay(0.15e3)
          .animate({ left: '+=18em' },
            {
              duration: 1.8e3 - 0.15e3,
              easing: 'linear',
              step: stepFn(4, maxX()),
            });
      },
      'slide-left': function () {
        $carbyBox
          .delay(0.15e3)
          .animate({ left: '-=18em' },
            {
              duration: 1.8e3 - 0.15e3,
              easing: 'linear',
              step: stepFn(4, maxX()),
            });
      },
      'high-jump': function () {
        const height = Math.floor(Math.random() * 100);
        $carbyBox
          .delay(0.375e3)
          .animate({ top: `-=${height}em` },
            {
              duration: 0.45e3,
              easing: 'easeOutSine',
              step: stepFn(1, maxY()),
            })
          .animate({ top: `+=${height}em` },
            {
              duration: 0.45e3,
              easing: 'easeInSine',
              step: stepFn(1, maxY()),
            });
      },
      'low-jump': function () {
        const height = Math.floor(Math.random() * 70);
        $carbyBox
          .delay(0.9e3)
          .animate({ top: `-=${height}em` },
            {
              duration: 0.3e3,
              easing: 'easeOutSine',
              step: stepFn(1, maxY()),
            })
          .animate({ top: `+=${height}em` },
            {
              duration: 0.3e3,
              easing: 'easeInSine',
              step: stepFn(1, maxY()),
            });
      },
    };
  })());

  const minDelayMs = 0.3e3;
  const maxDelayMs = 4e3;

  // spawn Carbuncle to start at random position on the page
  $carbyBox.css({
    left: Math.random() * ($(document).width() - $carbyBox.width()),
    top: $(window).height() - $carbyBox.height(),
    visibility: 'inherit',
  });

  // like an animation thread, by recursion and setTimeout
  (function animate() {
    const animation = animations[Math.floor(animations.length * Math.random())];
    $carby.addClass(animation)
      .one('animationend', function handler() {
        $(this).removeClass(animation);
        setTimeout(animate, minDelayMs + Math.floor((maxDelayMs - minDelayMs) * Math.random()));
      });
    (animationBehaviors[animation] || (() => {}))();
  }());
});
