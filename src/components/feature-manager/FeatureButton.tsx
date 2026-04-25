import type { Icon, IconProps } from "@tabler/icons-react";

type ButtonProps = {
  name: string;
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
  isActive: boolean;
};

export default function FeatureButton(props: ButtonProps) {
  return (
    <button type="button">
      {props.name}
      <props.icon />
    </button>
  );
}
