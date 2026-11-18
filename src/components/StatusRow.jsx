import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStatuses, groupStatuses } from '../utils/statusStore'
import { authorInfo, myHandle } from '../utils/statusAuthor'
import Avatar from './Avatar'
import StatusViewer from './StatusViewer'
import '../styles/story.css'

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function StatusRow() {
  const navigate = useNavigate()
  const items = useStatuses()
  const [viewer, setViewer] = useState(null)

  const me = myHandle()
  const groups = groupStatuses(items)
  const mine = groups.get(me) || []
  const myInfo = authorInfo(me)

  const others = Array.from(groups.entries())
    .filter(([handle]) => handle !== me)
    .map(([handle, list]) => ({
      handle,
      list,
      unseen: list.some(i => !i.views.some(v => v.u === me)),
      latest: list[list.length - 1].createdAt
    }))
    .sort((a, b) => {
      if (a.unseen !== b.unseen) return a.unseen ? -1 : 1
      return b.latest - a.latest
    })

  const openMine = () => {
    if (mine.length > 0) setViewer(me)
    else navigate('/status/new')
  }

  return (
    <>
      <div className="story-row">
        <div className="story-item" style={{ position: 'relative' }}>
          <button className="story-item" onClick={openMine} aria-label="Status yako">
            <span className={mine.length > 0 ? 'story-ring' : 'story-ring none'}>
              <span className="story-ring-inner">
                <Avatar username={me} src={myInfo.avatar} label={myInfo.name} size={58} />
              </span>
            </span>
            <span className="story-label">Status yako</span>
          </button>

          <button
            className="story-plus"
            onClick={() => navigate('/status/new')}
            aria-label="Weka status mpya"
          >
            <PlusIcon />
          </button>
        </div>

        {others.map(({ handle, unseen }) => {
          const info = authorInfo(handle)
          return (
            <button
              key={handle}
              className="story-item"
              onClick={() => setViewer(handle)}
              aria-label={`Tazama status ya ${info.name}`}
            >
              <span className={unseen ? 'story-ring' : 'story-ring seen'}>
                <span className="story-ring-inner">
                  <Avatar username={handle} src={info.avatar} label={info.name} size={58} />
                </span>
              </span>
              <span className="story-label">{info.name}</span>
            </button>
          )
        })}
      </div>

      {viewer && <StatusViewer handle={viewer} onClose={() => setViewer(null)} />}
    </>
  )
}

export default StatusRow