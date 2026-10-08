export default function DigitalTwinHero(){
  return <div className="bd-digital-twin-hero" aria-hidden="true">
    <div className="bd-twin-orbit bd-twin-orbit-a"/>
    <div className="bd-twin-orbit bd-twin-orbit-b"/>
    <div className="bd-twin-scan"/>
    <svg className="bd-twin-svg" viewBox="0 0 260 340" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="twinBody" x1="64" y1="30" x2="218" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8CE9FF" stopOpacity=".96"/>
          <stop offset=".28" stopColor="#3CB9E8" stopOpacity=".72"/>
          <stop offset=".66" stopColor="#163744" stopOpacity=".58"/>
          <stop offset="1" stopColor="#081217" stopOpacity=".92"/>
        </linearGradient>
        <linearGradient id="twinHot" x1="172" y1="52" x2="240" y2="286" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF6B8C"/>
          <stop offset=".5" stopColor="#FF3557"/>
          <stop offset="1" stopColor="#8E0D26" stopOpacity=".25"/>
        </linearGradient>
        <radialGradient id="twinCore" cx="0" cy="0" r="1" gradientTransform="translate(154 154) rotate(90) scale(78 96)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#AEEFFF" stopOpacity=".24"/>
          <stop offset=".58" stopColor="#1A7DA6" stopOpacity=".08"/>
          <stop offset="1" stopColor="#071114" stopOpacity="0"/>
        </radialGradient>
        <filter id="twinGlowBlue" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="twinGlowRed" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="r"/>
          <feMerge><feMergeNode in="r"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <clipPath id="torsoClip">
          <path d="M116 101C89 110 77 126 72 151L62 210C59 230 72 253 96 269L117 283C127 290 138 290 148 283L170 268C194 252 207 230 203 207L194 151C190 125 178 111 152 101C142 98 126 98 116 101Z"/>
        </clipPath>
      </defs>

      <g className="bd-twin-aura">
        <ellipse cx="145" cy="171" rx="92" ry="128" fill="url(#twinCore)"/>
      </g>

      <g className="bd-twin-body">
        <ellipse cx="137" cy="61" rx="36" ry="43" fill="url(#twinBody)" stroke="#9AEFFF" strokeOpacity=".72" strokeWidth="1.4"/>
        <path d="M106 58C112 39 122 29 138 27C154 26 165 36 170 54" stroke="#D9F7FF" strokeOpacity=".55"/>
        <path d="M102 67C118 60 153 60 171 67" stroke="#85DDF7" strokeOpacity=".35"/>
        <path d="M108 48C125 51 151 51 167 47" stroke="#85DDF7" strokeOpacity=".28"/>
        <path d="M137 20V101" stroke="#B6F1FF" strokeOpacity=".16"/>

        <path d="M116 101C89 110 77 126 72 151L62 210C59 230 72 253 96 269L117 283C127 290 138 290 148 283L170 268C194 252 207 230 203 207L194 151C190 125 178 111 152 101C142 98 126 98 116 101Z" fill="url(#twinBody)" stroke="#82DDF6" strokeWidth="1.5"/>
        <path d="M95 120C103 110 117 104 130 104C143 104 157 109 166 121L177 143C164 151 151 155 133 155C114 155 101 151 88 142L95 120Z" fill="#57C4E8" fillOpacity=".12"/>
        <path d="M130 104V282" stroke="#C5F5FF" strokeOpacity=".18"/>

        <path d="M82 136C61 145 48 165 43 194L35 244C32 261 41 274 55 275C68 276 77 266 80 250L90 194C94 172 101 154 111 142" fill="#0A1C22" fillOpacity=".88" stroke="#59C1E4" strokeWidth="1.3"/>
        <path d="M184 134C207 143 220 162 226 190L237 240C241 258 232 272 217 274C203 276 194 267 191 251L181 194C177 170 170 153 159 141" fill="#151018" fillOpacity=".88" stroke="url(#twinHot)" strokeWidth="2"/>

        <path d="M101 269C89 286 81 305 79 327" stroke="#4CB9DC" strokeWidth="9" strokeLinecap="round" opacity=".55"/>
        <path d="M163 268C176 286 184 306 186 329" stroke="#FF4766" strokeWidth="9" strokeLinecap="round" opacity=".48"/>
      </g>

      <g clipPath="url(#torsoClip)" className="bd-twin-grid">
        {Array.from({length:9}).map((_,i)=><path key={"h"+i} d={"M58 "+(120+i*18)+" C96 "+(113+i*18)+", 166 "+(113+i*18)+", 210 "+(122+i*18)} stroke="#9EEBFF" strokeOpacity=".13" strokeWidth=".8"/>)}
        {Array.from({length:7}).map((_,i)=><path key={"v"+i} d={"M"+(83+i*17)+" 98 C"+(72+i*20)+" 157, "+(83+i*19)+" 226, "+(97+i*15)+" 286"} stroke="#8ADFF6" strokeOpacity=".12" strokeWidth=".75"/>)}
      </g>

      <g className="bd-twin-hotspots" filter="url(#twinGlowRed)">
        <circle cx="183" cy="116" r="3.5" fill="#FF4766"/>
        <circle cx="194" cy="166" r="2.8" fill="#FF4766"/>
        <circle cx="176" cy="214" r="2.4" fill="#FF4766"/>
        <path d="M180 100C202 116 213 143 214 172" stroke="#FF4766" strokeWidth="1.2" strokeLinecap="round"/>
      </g>

      <g className="bd-twin-cool" filter="url(#twinGlowBlue)">
        <path d="M108 28C96 48 94 75 104 91" stroke="#8EE9FF" strokeWidth="1.3"/>
        <path d="M77 152C68 187 66 223 74 253" stroke="#79DDF8" strokeWidth="1.1"/>
        <circle cx="116" cy="155" r="2.4" fill="#9EEFFF"/>
      </g>

      <g className="bd-twin-core-pulse">
        <circle cx="137" cy="157" r="8" fill="#FF3557" fillOpacity=".08" stroke="#FF4667" strokeOpacity=".45"/>
        <circle cx="137" cy="157" r="2.5" fill="#FF4968"/>
      </g>

      <g className="bd-twin-dots">
        <circle cx="82" cy="86" r="1" fill="#8AEAFF"/>
        <circle cx="207" cy="108" r="1.2" fill="#FF4766"/>
        <circle cx="222" cy="147" r=".8" fill="#FF91A5"/>
        <circle cx="65" cy="182" r=".9" fill="#8AEAFF"/>
        <circle cx="216" cy="227" r=".8" fill="#FF4766"/>
      </g>
    </svg>
    <div className="bd-twin-hud">
      <span>DIGITAL TWIN</span>
      <b>LIVE</b>
    </div>
  </div>;
}
