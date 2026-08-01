import { Link } from "react-router-dom";
import { Compass, ArrowRight } from "lucide-react";
import Button from "../../components/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center select-none max-w-xl mx-auto space-y-6">
      {/* Icon with elegant layout */}
      <div className="w-20 h-20 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal mb-2 border border-brand-teal/20 shadow-inner animate-pulse">
        <Compass className="w-9 h-9" />
      </div>

      <div className="space-y-2">
        <span className="text-[10px] font-extrabold text-brand-teal bg-brand-teal/10 px-3 py-1 rounded-full uppercase tracking-wider">
          Error 404
        </span>
        <h1 className="font-serif text-3xl font-extrabold text-charcoal tracking-wide mt-2">
          Console Not Found
        </h1>
        <p className="text-muted-gray text-xs mt-2 leading-relaxed max-w-md mx-auto">
          The operations console you are attempting to access does not exist or
          has been relocated within the Rolad Ops database structure.
        </p>
      </div>

      {/* Action to return */}
      <div className="pt-2">
        <Link to="/dashboard">
          <Button
            variant="primary"
            icon={<ArrowRight className="w-4 h-4 shrink-0" />}
            iconPosition="right"
            className="bg-brand-teal hover:bg-brand-teal/95 font-semibold text-xs px-6 py-2.5 shadow-sm rounded-lg"
          >
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
