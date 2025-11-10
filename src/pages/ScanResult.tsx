import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";

const ScanResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // In a real app, you'd fetch this data based on the ID from an API or store
  // For now, we'll use mock data. You can enhance this later to store/retrieve actual results
  const result = {
    id: id || "unknown",
    type: "Deepfake", // Could be "Authentic" or "Deepfake"
    score: 99, // Percentage
    manipulation: "Face", // e.g., "Face", "Audio", "None"
    probability: "Very High", // e.g., "Low", "Medium", "High", "Very High"
    mediaUrl: "https://via.placeholder.com/640x360?text=Deepfake+Video", // Placeholder
    timestamp: new Date(),
  };

  const isDeepfake = result.type === "Deepfake";
  const scoreColor = isDeepfake ? "text-red-600" : "text-green-600";
  const probabilityColor = isDeepfake ? "text-red-500" : "text-green-500";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 py-8">
      {/* Logo and Branding */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DeepGuard</h1>
          <p className="text-xs text-gray-600">AI Content Verification</p>
        </div>
      </div>

      {/* Result Status */}
      <div className="flex flex-col items-center mb-6">
        {isDeepfake ? (
          <>
            <ShieldAlert className="w-16 h-16 text-red-500 mb-2" />
            <h2 className="text-3xl font-bold text-red-600 mb-1">Deepfake</h2>
          </>
        ) : (
          <>
            <ShieldCheck className="w-16 h-16 text-green-500 mb-2" />
            <h2 className="text-3xl font-bold text-green-600 mb-1">Authentic</h2>
          </>
        )}
      </div>

      {/* Media Preview */}
      <div className="w-full max-w-2xl bg-gray-100 rounded-lg overflow-hidden shadow-lg mb-6">
        <div className="relative pt-[56.25%]">
          <img
            src={result.mediaUrl}
            alt="Media Preview"
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Details */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-700 font-medium">Overall Deepfake Score</span>
          <span className={`text-xl font-bold ${scoreColor}`}>{result.score}%</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-700 font-medium">Detected Manipulation</span>
          <span className="text-gray-800 font-medium">{result.manipulation}</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="text-gray-700 font-medium">Probability</span>
          <span className={`font-medium ${probabilityColor}`}>{result.probability}</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => navigate("/main")}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scanner
        </Button>
        <Button
          onClick={() => navigate("/")}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default ScanResult;