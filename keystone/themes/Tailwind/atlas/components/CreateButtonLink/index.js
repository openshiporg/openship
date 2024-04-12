import { AdminLink } from "@keystone/components/AdminLink";
import { Button } from "@keystone/primitives/default/ui/button";
import { Plus, Squircle } from "lucide-react";

export const CreateButtonLink = (props) => {
  return (
    <AdminLink href={`/${props.list.path}/create`}>
      <Button color="dark/slate">
        {/* <div className="relative h-5 w-5 mr-0.5">
          <Plus strokeWidth={2} className="h-5 w-5 p-[4px] ml-[-0.3px] mt-[-0.5px] absolute inset-0" />
          <Squircle strokeWidth={1} className="h-5 w-5 absolute inset-0" />
        </div> */}
        <Plus className="h-5 w-5" />
        Create {props.list.singular}
        {/* <Squircle className="mr-2 h-5 w-5" /> Create {props.list.singular} */}
      </Button>
    </AdminLink>
  );
};
