import { configure } from '@storybook/react';

function loadStories() {
  require('../src/story.js');
}

configure(loadStories, module);
