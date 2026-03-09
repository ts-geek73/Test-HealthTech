import { sections } from "@/constants";
import type { SectionType } from "@/constants";

interface SectionNavProps {
    activeSection: SectionType;
    onSectionChange: (section: SectionType) => void;
}
export const MobileSectionNav = ({ activeSection, onSectionChange }: SectionNavProps) => {
    return (
        <div className="flex flex-col border-l border-border md:border-l">
            {/* Mobile Navigation - Visible only on mobile */}
            <div className="md:hidden border-b border-border bg-sidebar-background">
                <div className="flex overflow-x-auto scrollbar-hide">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <button
                                key={section.id}
                                onClick={() => {
                                    onSectionChange(section.id);
                                }}
                                className={`flex-1 flex gap-3 items-center min-w-[80px] px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${activeSection === section.id
                                    ? "bg-primary text-white border-b-2 border-primary"
                                    : "text-sidebar-foreground hover:bg-primary/10"
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {section.label}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}