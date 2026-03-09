import { cn } from "@/lib/utils";
import { sections } from "@/constants";
import type { SectionType } from "@/constants";

interface SectionNavProps {
    activeSection: SectionType;
    onSectionChange: (section: SectionType) => void;
}

export const SectionNav = ({ activeSection, onSectionChange }: SectionNavProps) => {
    return (
        <nav className="hidden md:flex w-48 bg-sidebar-background text-sidebar-foreground flex-col">
            <div className="p-[30px] border-b border-border">
                <h2 className="text-sm font-semibold tracking-wide uppercase opacity-70">
                    Sections
                </h2>
            </div>
            <div className="flex-1">
                {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => onSectionChange(section.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                                "hover:bg-primary hover:text-white",
                                isActive && "bg-primary border-primary text-white"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{section.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
