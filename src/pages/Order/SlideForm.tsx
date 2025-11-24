import { useEffect, useRef, useState } from "react";

interface SlideFormProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export const SlideForm = ({ value, onChange }: SlideFormProps) => {
  const [items, setItems] = useState<string[]>(value || []);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const updateParent = (list: string[]) => {
    onChange(list);
  };

  const handleAddTag = () => {
    const newValue = input.trim();
    if (newValue && !items.includes(newValue)) {
      const newItems = [...items, newValue];
      setItems(newItems);
      updateParent(newItems);
      setInput("");
      inputRef.current?.focus();
    }
  };

  const handleRemoveTag = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    updateParent(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && input === "" && items.length > 0) {
      handleRemoveTag(items.length - 1);
    }
  };

  useEffect(() => {
    setItems(value || []);
  }, [value]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-indigo-500">
        {items.map((item, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
            <span>{item}</span>
          </div>
        ))}

        <input
          ref={inputRef}
          className="flex-grow min-w-[120px] outline-none bg-transparent"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};
