import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Video, Mic, Image as ImageIcon, Link as LinkIcon, Upload, Brain } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      {/* Logo and Branding */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative">
          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DeepTrust</h1>
          <p className="text-sm text-gray-600">Restoring trust in what we see and hear</p>
        </div>
      </div>

      {/* Main Question */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-3">Real or fake?</h2>
        <p className="text-lg text-gray-700">
          Capture a short video, audio or image to check.
        </p>
      </div>

      {/* Capture Icons */}
      <div className="flex gap-8 mb-12">
        <button
          onClick={() => navigate("/main?tab=scanner")}
          className="flex flex-col items-center gap-2 p-4 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Video className="w-12 h-12 text-gray-900" />
        </button>
        <button
          onClick={() => navigate("/main?tab=scanner")}
          className="flex flex-col items-center gap-2 p-4 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <Mic className="w-12 h-12 text-gray-900" />
        </button>
        <button
          onClick={() => navigate("/main?tab=scanner")}
          className="flex flex-col items-center gap-2 p-4 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <ImageIcon className="w-12 h-12 text-gray-900" />
        </button>
      </div>

      {/* Separator */}
      <div className="w-full max-w-md border-t border-gray-200 mb-8"></div>

      {/* Alternative Input Options */}
      <div className="text-center mb-6">
        <p className="text-gray-600 mb-6">Verify a file or link</p>
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/main?tab=upload&mode=url")}
            className="flex items-center gap-2 px-6 py-3"
          >
            <LinkIcon className="w-5 h-5" />
            Paste Link
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/main?tab=upload&mode=file")}
            className="flex items-center gap-2 px-6 py-3"
          >
            <Upload className="w-5 h-5" />
            Upload File
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Landing;