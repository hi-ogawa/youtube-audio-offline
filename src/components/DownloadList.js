import React from 'react';
import _ from 'lodash';
import CN from 'classnames';

import { useActions, useStatePath } from '../stateUtils';
import { formatBytes } from '../utils';

export default function DownloadList() {
  const { startDownloadAudio, cancelDownloadAudio, removeDownloadEntry } = useActions();
  const downloads = useStatePath('downloads');
  const tracks = useStatePath('tracks');

  return (
    <div id='download-list-container'>
      <div>Downloads</div>
      <div>
        { downloads.map(d => {
            const track = _.find(tracks, { id: d.id });
            console.assert(track.downloadState !== 'NOT_STARTED');
            return (
              <div key={d.id}>
                <div>
                  <div>{ track.title }</div>
                  <div>{ track.author }</div>
                </div>

                { track.downloadState === 'LOADING' &&
                  <>
                    <div>
                      { d.progress
                        ? `${formatBytes(d.progress.loaded)} / ${formatBytes(d.progress.total)}`
                        : '0KB / --B'
                      }
                    </div>
                    <div
                      onClick={() => d.canceller && cancelDownloadAudio(track.id)}
                      className={CN({ 'non-cancellable-loading': !d.canceller })}
                    >
                      <div className='spinner' />
                      <i className='material-icons'>pause</i>
                    </div>
                  </>
                }

                { track.downloadState === 'CANCELLED' &&
                  <>
                    <div>CANCELLED</div>
                    <div onClick={() => startDownloadAudio(track.id)}>
                      <i className='material-icons'>replay</i>
                    </div>
                  </>
                }

                { track.downloadState === 'ERROR' &&
                  <>
                    <div>ERROR</div>
                    <div onClick={() => startDownloadAudio(track.id)}>
                      <i className='material-icons'>replay</i>
                    </div>
                  </>
                }

                { track.downloadState === 'DONE' &&
                  <>
                    <div>COMPLETE</div>
                    <div onClick={() => removeDownloadEntry(track.id)}>
                      <i className='material-icons'>close</i>
                    </div>
                  </>
                }
              </div>
            );
        })}
      </div>
    </div>
  );
}
