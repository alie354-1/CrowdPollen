export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex flex-col items-center justify-center">
      <div className="text-center text-white">
        {/* Logo/Icon */}
        <div className="text-6xl mb-6">🌻</div>
        
        {/* App Name */}
        <h1 className="text-3xl font-bold mb-4">CrowdPollen</h1>
        
        {/* Loading Spinner */}
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
        
        {/* Loading Text */}
        <p className="text-white/80">Loading...</p>
      </div>
    </div>
  )
}
