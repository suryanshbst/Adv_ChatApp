"use client";

interface InputProps {
  placeholder: string;
  width: string;
  height: string;
  backgroundColor?: string;
  color?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  textSize?: string;
  type?: string;
  icon?: React.ReactNode;
  value?: string;
}

export function Input(props: InputProps) {
  return (
    <div className="flex items-center">
      {props.icon && <span className="mr-2">{props.icon}</span>}
      <input
        className="rounded-md font-semibold px-5"
        style={{
          width: props.width,
          height: props.height,
          backgroundColor: props.backgroundColor,
          color: props.color,
          fontSize: props.textSize,
        }}
        type={props.type || "text"}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange && props.onChange(e)}
      />
    </div>
  );
}
