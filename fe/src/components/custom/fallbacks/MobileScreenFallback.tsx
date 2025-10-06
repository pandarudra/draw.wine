import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Palette,
  Smartphone,
  Users,
  ExternalLink,
  Github,
} from "lucide-react";

export const MobileScreenFallback = () => {
  const handleViewDesktop = () => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute("content", "width=1024");
    }
    window.location.reload();
  };

  const handleViewGithub = () => {
    window.open(
      "https://github.com/pandarudra/draw.wine",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const features = [
    {
      icon: <Palette className="w-5 h-5 text-primary" />,
      title: "Rich Drawing Tools",
      description:
        "Professional-grade brushes, shapes, and drawing instruments",
    },
    {
      icon: <Users className="w-5 h-5 text-primary" />,
      title: "Real-time Collaboration",
      description: "Work together with others in real-time on shared canvases",
    },
    {
      icon: <Monitor className="w-5 h-5 text-primary" />,
      title: "Full Canvas Experience",
      description: "Unlimited canvas space with precision drawing controls",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto relative">
        <Card className="border-2 shadow-2xl backdrop-blur-sm bg-card/95">
          <CardContent className="p-8 text-center space-y-6">
            <div className="space-y-3">
              <div className="text-6xl mb-2 animate-pulse">🎨</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Draw.Wine
              </h1>
              <Badge variant="secondary" className="text-xs">
                Collaborative Drawing Platform
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Smartphone className="w-5 h-5" />
                <span className="text-sm font-medium">
                  Mobile Device Detected
                </span>
              </div>

              <h2 className="text-xl font-semibold text-foreground leading-tight">
                Desktop Experience Required
              </h2>

              <p className="text-muted-foreground text-sm leading-relaxed">
                Draw.Wine is optimized for desktop devices to provide the best
                drawing and collaboration experience. Please access from a
                desktop computer or tablet for full functionality.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground/80 mb-3">
                What awaits you on desktop:
              </h3>
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 text-left p-3 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="flex-shrink-0 mt-0.5">{feature.icon}</div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-medium text-foreground">
                        {feature.title}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={handleViewDesktop}
                className="w-full gap-2 font-medium"
              >
                <Monitor className="w-4 h-4" />
                Try Desktop Version
              </Button>

              <Button
                variant="outline"
                onClick={handleViewGithub}
                className="w-full gap-2 text-sm"
              >
                <Github className="w-4 h-4" />
                View on GitHub
                <ExternalLink className="w-3 h-3" />
              </Button>

              <p className="text-xs text-muted-foreground">
                Or visit us from a desktop computer for the optimal experience
              </p>
            </div>

            <div className="pt-4 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                Built with ❤️ for creative collaboration
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
};
