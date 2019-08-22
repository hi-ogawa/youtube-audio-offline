import React from 'react';
import { render, fireEvent, waitForDomChange } from '@testing-library/react';
import _ from 'lodash';
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
