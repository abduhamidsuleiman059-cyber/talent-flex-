import { useState } from 'react'
import '../styles/splash.css'

function Splash({ fading }) {
  const [imgFailed, setImgFailed] = useState(false)
  // BASE_URL ni "/talent-flex-/" mtandaoni na "/" kwenye kompyuta yako
  const logo = `${import.meta.env.BASE_URL}logo.png`

  return (
    <div className={fading ? 'splash fading' : 'splash'}>
      <div className="splash-content">
        {imgFailed ? (
          <h1 className="splash-text">TalentFlex</h1>
        ) : (
          <img
            src={logo}
            alt="TalentFlex"
            className="splash-logo"
            onError={() => setImgFailed(true)}
            draggable={false}
          />
        )}

        <div className="splash-bar">
          <span />
        </div>
      </div>
    </div>
  )
}

export default Splash