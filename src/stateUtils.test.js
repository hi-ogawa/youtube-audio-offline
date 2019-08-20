import React from 'react';
import { render, fireEvent, waitForDomChange } from '@testing-library/react';
import _ from 'lodash';
import gql from 'graphql-tag';
import graphql from 'graphql-anywhere';
import { useLoader } from './stateUtils';

it('useLoader', async () => {
  function f(b) {
    return new Promise((resolve, reject) => {
      b ? resolve('SUCCESS') : reject('ERROR');
    });
  }
  function X() {
    const [newF, state] = useLoader(f);
    return (
      <div>
         <button onClick={() => newF(true)} onDoubleClick={() => newF(false)} />
         <p>{ JSON.stringify(state, null, 2) }</p>
      </div>
    );
  }
  const { container } = render(<X />);
  const getStateObj = () => JSON.parse(container.querySelector('p').textContent);

  expect(getStateObj()).toEqual({
    loading: false,
    error: null,
  });

  fireEvent.click(container.querySelector('button'));

  expect(getStateObj()).toEqual({
    loading: true,
    error: null,
  });

  await waitForDomChange({ container });

  expect(getStateObj()).toEqual({
    loading: false,
    error: null,
  });

  fireEvent.dblClick(container.querySelector('button'));

  expect(getStateObj()).toEqual({
    loading: true,
    error: null,
  });

  await waitForDomChange({ container });

  expect(getStateObj()).toEqual({
    loading: false,
    error: 'ERROR',
  });

  return Promise.resolve()
});

it('graphql-anywhere', () => {
  const resolverQuery = {
    track: (_, { id }, state) =>
      state.tracks.find(t => id === t.id)
  }

  const resolverAnywhere = (fieldName, rootValue, args, state) =>
    resolverQuery[fieldName]
    ? resolverQuery[fieldName](null, args, state)
    : rootValue[fieldName];

  const state = {
    tracks: [
      { id: 1, text: 'hello' },
      { id: 2, text: 'world' },
      { id: 3, text: 'earth' }
    ]
  }
  const Q1 = gql`
    {
      tracks {
        text
      }
    }
  `;

  const V2 = { id: 2 }
  const Q2 = gql`
    query _($id: ID!) {
      track(id: $id) {
        text
      }
    }
  `;

  expect(
    graphql(resolverAnywhere, Q1, state, state)
  ).toEqual({ tracks: state.tracks.map(t => _.pick(t, ['text']))});

  expect(
    graphql(resolverAnywhere, Q2, state, state, V2)
  ).toEqual({
    track: {
      text: 'world'
    }
  })
});
