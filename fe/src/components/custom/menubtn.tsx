import { type FC } from "react";
import { MenubarMenu, MenubarTrigger } from "../ui/menubar";
import { useTheme } from "@/contexts/ThemeContext";

interface IMenubtn {
  state: boolean;
  compoBefore: FC;
  compoAfter: FC;
  onClick: () => void;
}

export const CMenubtn = ({
  state,
  compoBefore: BeforeComponent,
  compoAfter: AfterComponent,
  onClick,
}: IMenubtn) => {
  const { theme } = useTheme();
  return (
    <MenubarMenu>
      <MenubarTrigger
        onClick={onClick}
        className={`w-10 h-10 flex justify-center items-center ${
          state
            ? theme === "light"
              ? "bg-[#E3E2FE] hover:bg-[#E3E2FE] "
              : "bg-[#2D2D2D] hover:bg-[#4A4A4A]"
            : ""
        }`}
      >
        {state ? <AfterComponent /> : <BeforeComponent />}
      </MenubarTrigger>
    </MenubarMenu>
  );
};
