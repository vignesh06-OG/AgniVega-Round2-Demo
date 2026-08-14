import { Check, ChevronsUpDown, Languages } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LANGUAGES, LANGUAGE_REGION, REGIONS, t, type Lang } from "@/lib/krishi/i18n";

/** Searchable picker across every scheduled Indian language. */
export function LanguagePicker({
  value,
  onChange,
  className = "w-[170px]",
}: {
  value: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`${className} justify-between gap-2 bg-background`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Languages className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">{current?.label ?? "English"}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="end">
        <Command
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder={t("searchLanguage", value)} />
          <CommandList className="max-h-72">
            <CommandEmpty>No language found.</CommandEmpty>
            {REGIONS.filter((region) =>
              LANGUAGES.some((l) => LANGUAGE_REGION[l.code] === region),
            ).map((region) => (
              <CommandGroup key={region} heading={region}>
                {LANGUAGES.filter((l) => LANGUAGE_REGION[l.code] === region).map((lang) => (
                  <CommandItem
                    key={lang.code}
                    value={`${lang.label} ${lang.english} ${lang.code} ${region}`}
                    onSelect={() => {
                      onChange(lang.code);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${lang.code === value ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="flex-1">{lang.label}</span>
                    <span className="text-xs text-muted-foreground">{lang.english}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
