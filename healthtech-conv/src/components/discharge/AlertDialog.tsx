import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialog as AlertDialogPrimitive,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  content: {
    title: string;
    description: string;
    actionText: string;
  };
}

const AlertDialog = ({
  open,
  onOpenChange,
  onConfirm,
  content,
}: AlertDialogProps) => {
  return (
    <AlertDialogPrimitive open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[92%] sm:max-w-[425px] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="max-sm:text-left">
            {content?.title || "Are you sure?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="max-sm:text-left">
            {content?.description || ""}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-row justify-end items-center gap-4">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {content?.actionText || "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogPrimitive>
  );
};

export default AlertDialog;
