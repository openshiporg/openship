import { Plus } from "lucide-react";
import { AdminLink } from "../AdminLink";
import { Button } from "../../primitives/default/ui/button";

export const CreateButtonLink = (props) => {
  return (
    <AdminLink href={`/${props.list.path}/create`}>
      <Button className="pr-4">
        {/* <div className="relative h-5 w-5 mr-0.5">
          <Plus strokeWidth={2} className="h-5 w-5 p-[4px] ml-[-0.3px] mt-[-0.5px] absolute inset-0" />
          <Squircle strokeWidth={1} className="h-5 w-5 absolute inset-0" />
        </div> */}
        <Plus className="h-5 w-5 mr-2" />
        Create {props.list.singular}
        {/* <Squircle className="mr-2 h-5 w-5" /> Create {props.list.singular} */}
      </Button>
    </AdminLink>
  );
};
