import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { type Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type BaseSyntheticEvent, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Species = Database["public"]["Tables"]["species"]["Row"];

const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

const speciesSchema = z.object({
  scientific_name: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val?.trim()),
  common_name: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  kingdom: kingdoms,
  total_population: z.number().int().positive().min(1).nullable(),
  image: z
    .string()
    .url()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  description: z
    .string()
    .nullable()
    // Transform empty string or only whitespace input to null before form submission, and trim whitespace otherwise
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  endangered: z.boolean(),
});

type FormData = z.infer<typeof speciesSchema>;

export default function SpeciesDetailsDialog({ species, currentUser }: { species: Species; currentUser: string }) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  const defaultValues: Partial<FormData> = {
    scientific_name: species.scientific_name,
    common_name: species.common_name,
    kingdom: species.kingdom,
    total_population: species.total_population,
    image: species.image,
    description: species.description,
    endangered: species.endangered ?? false, // handle the case where endangered is null.
  };

  const form = useForm<FormData>({
    resolver: zodResolver(speciesSchema),
    defaultValues,
    mode: "onChange",
  });

  // Don't need to filter for bad inputs, as form data instantiated earlier.
  const onSubmit = async (input: FormData) => {
    // async allows for await keyboard
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.from("species").update(input).eq("id", species.id); // await the supabase

    if (error) {
      // null values evaluate to false for error, non-null evaluates to true
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    setIsEditing(false);

    form.reset(input);

    router.refresh();

    return toast({
      // Popup for successful update
      title: "Changes Saved!",
      description: "Saved your changes to " + input.scientific_name,
    });
  };

  const startEditing = (e: MouseEvent) => {
    e.preventDefault(); // Prevent the default action of the button
    setIsEditing(true);
  };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Revert all unsaved changes?")) {
      return;
    }
    form.reset(defaultValues); /*Undo any changes that the user made*/
    setIsEditing(false);
  };

  // Async allows the rest of the app to keep running while this is deleted
  const handleDelete = async (e: MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("Delete the species?")) {
      return;
    }

    const supabase = createBrowserSupabaseClient();

    // Instead of fire and forgetting, wait for response from server and determine if there is error
    const { error } = await supabase.from("species").delete().eq("id", species.id);

    if (error) {
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    router.refresh();

    return toast({
      // Popup for successful update
      title: "Species Deleted!",
      description: "Your card has been successfully deleted",
    });
  };

  // console.log(species.profile);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="mt-3 w-full">Learn More</Button>
      </DialogTrigger>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{species.scientific_name}</DialogTitle>
          {species.common_name && <DialogDescription>{species.common_name}</DialogDescription>}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
            <div className="grid w-full items-center gap-4">
              <FormField
                control={form.control}
                name={"scientific_name"}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scientific Name</FormLabel>
                    <FormControl>
                      <Input readOnly={!isEditing} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="common_name"
                render={({ field }) => {
                  // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Common Name</FormLabel>
                      <FormControl>
                        <Input readOnly={!isEditing} value={value ?? ""} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="kingdom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kingdom</FormLabel>
                    {isEditing ? (
                      <Select onValueChange={(value) => field.onChange(kingdoms.parse(value))} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {kingdoms.options.map((kingdom, index) => (
                              <SelectItem key={index} value={kingdom}>
                                {kingdom}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input readOnly value={field.value} className="cursor-default" />
                      </FormControl> // Ensure it doesn't appear editable w/ the cursor
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_population"
                render={({ field }) => {
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Total population</FormLabel>
                      <FormControl>
                        {/* Using shadcn/ui form with number: https://github.com/shadcn-ui/ui/issues/421 */}
                        <Input
                          readOnly={!isEditing}
                          type="number"
                          value={value ?? ""}
                          {...rest}
                          onChange={(event) => field.onChange(+event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="endangered"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endangered Status</FormLabel>
                    {isEditing ? (
                      <Select onValueChange={(value) => field.onChange(value === "true")}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={field.value ? "Endangered" : "Not Endangered"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem value="true">Endangered</SelectItem>
                            <SelectItem value="false">Not Endangered</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <Input
                          readOnly
                          value={field.value ? "Endangered" : "Not Endangered"}
                          className="cursor-default"
                        />
                      </FormControl>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => {
                  // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input readOnly={!isEditing} value={value ?? ""} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => {
                  // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                  const { value, ...rest } = field;
                  return (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea readOnly={!isEditing} value={value ?? ""} {...rest} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              {currentUser === species.author && (
                <div className="flex">
                  {isEditing ? (
                    <>
                      <Button type="submit" className="ml-1 mr-1 flex-auto">
                        Confirm
                      </Button>
                      <Button
                        onClick={handleCancel}
                        type="button"
                        className="ml-1 mr-1 flex-auto"
                        variant="secondary"
                        style={{ color: "gray" }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={startEditing} type="button" className="ml-1 mr-1 flex-auto">
                        Edit species
                      </Button>
                      <Button
                        onClick={(e) => {
                          void handleDelete(e); // Ensure that the function call is treated as returning void
                        }}
                        type="button"
                        className="ml-1 mr-1 flex-auto"
                        style={{ color: "red" }}
                        variant="secondary"
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
