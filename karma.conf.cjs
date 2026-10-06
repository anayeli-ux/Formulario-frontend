module.exports = config => {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-firefox-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    reporters: ['progress', 'kjhtml'],
    browsers: ['FirefoxHeadless'],
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: './coverage/formulario-angular-18',
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }]
    },
    restartOnFileChange: true
  });
};