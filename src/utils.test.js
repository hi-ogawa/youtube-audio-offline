import { update } from './utils';

it('update', () => {
  const before = {
    arr: [
      {
        id: 0,
        innerArr: [{ id: 3, value: 'a'}]
      },
      {
        id: 1,
        innerArr: [{ id: 4, value: 'b' }, { id: 5, value: 'c' }]
      }
    ]
  };
  const op = {
    arr: {
      $find: {
        $query: { id: 1 },
        $op: {
          innerArr: {
            $find: {
              $query: { id: 4 },
              $op: { $merge: { value: 'UPDATED' } }
            }
          }
        }
      }
    }
  };
  const after = {
    arr: [
      {
        id: 0,
        innerArr: [{ id: 3, value: 'a' }]
      },
      {
        id: 1,
        innerArr: [{ id: 4, value: 'UPDATED' }, { id: 5, value: 'c' }]
      }
    ]
  }
  update.defineCustomQuery();
  expect(update(before, op)).toEqual(after);
});
