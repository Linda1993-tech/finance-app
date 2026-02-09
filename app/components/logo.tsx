export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="worthflow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      {/* Circular background */}
      <circle cx="50" cy="50" r="48" fill="url(#worthflow-gradient)" opacity="0.1" />
      
      {/* W with flow lines - main logo */}
      <g transform="translate(15, 25)">
        {/* Left part of W */}
        <path
          d="M5 5 L15 40 L25 15"
          stroke="url(#worthflow-gradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Right part of W */}
        <path
          d="M25 15 L35 40 L45 5"
          stroke="url(#worthflow-gradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Flow lines - representing money flow */}
        <path
          d="M50 8 L60 8"
          stroke="url(#worthflow-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M52 15 L65 15"
          stroke="url(#worthflow-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M50 22 L62 22"
          stroke="url(#worthflow-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.3"
        />
      </g>
    </svg>
  )
}

export function LogoWithText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo className="w-10 h-10" />
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        WorthFlow
      </span>
    </div>
  )
}
