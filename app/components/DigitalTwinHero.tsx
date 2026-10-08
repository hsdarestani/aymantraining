export default function DigitalTwinHero(){
  return <div className="bd-digital-twin-hero bd-digital-twin-refined" aria-hidden="true">
    <div className="bd-twin-orbit bd-twin-orbit-a"/>
    <div className="bd-twin-orbit bd-twin-orbit-b"/>
    <div className="bd-twin-scan"/>
    <svg className="bd-twin-svg" viewBox="0 0 300 330" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rimCool" x1="66" y1="40" x2="214" y2="298" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B9F5FF"/>
          <stop offset=".36" stopColor="#5DC7E9"/>
          <stop offset=".72" stopColor="#1F6E88" stopOpacity=".78"/>
          <stop offset="1" stopColor="#0B222B" stopOpacity=".08"/>
        </linearGradient>
        <linearGradient id="rimHot" x1="205" y1="44" x2="246" y2="286" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF8EA7"/>
          <stop offset=".42" stopColor="#FF4969"/>
          <stop offset="1" stopColor="#5E1021" stopOpacity=".18"/>
        </linearGradient>
        <linearGradient id="glassFill" x1="116" y1="79" x2="182" y2="286" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A7EFFF" stopOpacity=".08"/>
          <stop offset=".48" stopColor="#2B9BC0" stopOpacity=".045"/>
          <stop offset="1" stopColor="#061014" stopOpacity=".01"/>
        </linearGradient>
        <radialGradient id="chestGlow" cx="0" cy="0" r="1" gradientTransform="translate(180 168) rotate(90) scale(88 106)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#54D9FF" stopOpacity=".14"/>
          <stop offset=".58" stopColor="#216A82" stopOpacity=".035"/>
          <stop offset="1" stopColor="#061014" stopOpacity="0"/>
        </radialGradient>
        <filter id="softBlue" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4.2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softRed" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4.8" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="bustClip">
          <path d="M129 103C107 109 91 124 82 145C74 164 69 192 68 227C82 244 99 256 118 263C135 270 153 273 174 271C199 269 218 260 235 245C235 211 231 184 223 161C214 136 197 116 174 106C162 101 143 100 129 103Z"/>
        </clipPath>
      </defs>

      <ellipse className="bd-twin-aura" cx="176" cy="169" rx="101" ry="132" fill="url(#chestGlow)"/>

      <g className="bd-twin-bust">
        <path d="M143 31C129 35 118 44 112 58C107 70 106 86 111 98C115 108 124 115 136 118C147 121 159 119 168 113C178 107 185 96 188 82C191 67 188 53 180 43C171 32 157 27 143 31Z" fill="url(#glassFill)" stroke="url(#rimCool)" strokeWidth="1.2"/>
        <path d="M180 43C189 52 192 66 189 82C186 98 178 109 167 115" stroke="url(#rimHot)" strokeWidth="1.35" strokeLinecap="round"/>

        <path d="M129 103C107 109 91 124 82 145C74 164 69 192 68 227C82 244 99 256 118 263C135 270 153 273 174 271C199 269 218 260 235 245C235 211 231 184 223 161C214 136 197 116 174 106C162 101 143 100 129 103Z" fill="url(#glassFill)" stroke="url(#rimCool)" strokeWidth="1.35"/>
        <path d="M176 106C198 117 214 137 222 161C230 184 234 210 235 244" stroke="url(#rimHot)" strokeWidth="1.6" strokeLinecap="round"/>

        <path d="M135 118C128 129 124 143 124 158M162 117C171 129 177 143 178 158" stroke="#9BE8FB" strokeOpacity=".22" strokeWidth=".8"/>
        <path d="M101 145C115 135 130 130 147 130C164 130 181 136 196 148" stroke="#9BE8FB" strokeOpacity=".17"/>
        <path d="M92 166C110 154 128 150 148 150C169 150 189 156 207 168" stroke="#9BE8FB" strokeOpacity=".12"/>
        <path d="M86 189C107 177 128 172 150 172C174 172 195 179 216 192" stroke="#9BE8FB" strokeOpacity=".095"/>
        <path d="M83 213C104 203 127 198 151 198C177 198 200 205 222 218" stroke="#9BE8FB" strokeOpacity=".075"/>

        <path d="M115 132C109 160 108 197 115 243M138 126C135 164 136 215 141 265M160 125C165 165 165 218 162 268M184 132C193 163 197 199 195 257" stroke="#77D6EF" strokeOpacity=".085" strokeWidth=".7"/>

        <path d="M126 107C113 113 104 124 99 136C91 154 86 182 84 219" stroke="#C7F7FF" strokeOpacity=".48" strokeWidth="1.05" strokeLinecap="round"/>
        <path d="M101 246C120 257 140 262 161 262" stroke="#89E5FA" strokeOpacity=".22"/>
      </g>

      <g className="bd-twin-face-lines">
        <path d="M118 67C132 62 153 62 174 67" stroke="#9BE8FB" strokeOpacity=".18"/>
        <path d="M120 83C135 80 155 80 175 84" stroke="#9BE8FB" strokeOpacity=".12"/>
        <path d="M146 34V116" stroke="#B8F2FF" strokeOpacity=".10"/>
        <path d="M129 44C139 51 150 53 164 51" stroke="#D0F9FF" strokeOpacity=".16"/>
      </g>

      <g className="bd-twin-hotspots" filter="url(#softRed)">
        <circle cx="184" cy="134" r="2.6" fill="#FF4A69"/>
        <circle cx="205" cy="177" r="2.2" fill="#FF4A69"/>
        <circle cx="195" cy="225" r="1.8" fill="#FF4A69"/>
        <path d="M178 111C197 122 211 145 216 171" stroke="#FF4A69" strokeOpacity=".55" strokeWidth="1"/>
      </g>

      <g className="bd-twin-cool" filter="url(#softBlue)">
        <path d="M115 47C108 60 108 81 114 95" stroke="#8EEAFF" strokeWidth="1"/>
        <path d="M80 148C73 171 70 197 71 224" stroke="#78DDF6" strokeWidth=".9"/>
        <circle cx="122" cy="159" r="1.8" fill="#9CEBFF"/>
      </g>

      <g className="bd-twin-core-pulse">
        <circle cx="154" cy="164" r="8.5" fill="#FF3C5D" fillOpacity=".045" stroke="#FF5571" strokeOpacity=".28"/>
        <circle cx="154" cy="164" r="1.7" fill="#FF5571"/>
      </g>

      <g className="bd-twin-particles">
        <circle cx="231" cy="113" r=".8" fill="#FF6B85"/>
        <circle cx="241" cy="148" r=".55" fill="#7EE7FF"/>
        <circle cx="219" cy="94" r=".55" fill="#7EE7FF"/>
        <circle cx="82" cy="118" r=".55" fill="#7EE7FF"/>
        <circle cx="245" cy="203" r=".65" fill="#FF5A76"/>
      </g>
    </svg>
  </div>;
}
