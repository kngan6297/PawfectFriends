import React from "react";
import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  onClick,
  ...props
}) => {
  return (
    <div
      className={clsx(
        "bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100",
        hoverEffect &&
          "transition-all duration-300 hover:scale-[1.02] hover:shadow-md hover:border-primary-100",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
}) => (
  <div
    className={clsx("p-5 border-b border-gray-100 bg-gray-50/50", className)}
  >
    {children}
  </div>
);

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
}) => <div className={clsx("p-5", className)}>{children}</div>;

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className }) => (
  <div className={clsx("p-5", className)}>{children}</div>
);

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  className,
}) => (
  <h3 className={clsx("text-xl font-semibold text-gray-900", className)}>
    {children}
  </h3>
);

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className,
}) => (
  <p className={clsx("text-sm text-gray-500 mt-1", className)}>{children}</p>
);

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
}) => (
  <div
    className={clsx("p-5 border-t border-gray-100 bg-gray-50/50", className)}
  >
    {children}
  </div>
);
