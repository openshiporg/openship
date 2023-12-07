import { AdminLink } from "@keystone/components/AdminLink";
import { Button } from "@keystone/primitives/default/ui/button";
import { Plus } from "lucide-react";

export const CreateButtonLink = (props) => {
  return (
    <AdminLink href={`/${props.list.path}/create`}>
      <Button>
        <Plus className="mr-2 h-4 w-4" /> Create{" "}
        {props.list.singular}
      </Button>
    </AdminLink>
  );
};
