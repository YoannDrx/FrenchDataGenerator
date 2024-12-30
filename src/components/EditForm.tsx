import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { FakeDataStore } from "../store";
import { FakeDataState } from "../types/types";

interface EditFormProps {
  fakeData: FakeDataState | null;
  onClose: () => void;
}

export function EditForm({ fakeData, onClose }: EditFormProps) {
  const [dob, setDob] = useState(fakeData?.dob || "");
  const [isMinor, setIsMinor] = useState(dob ? new Date().getFullYear() - parseInt(dob.split("/")[2], 10) < 18 : false);

  const handleSave = async () => {
    try {
      const updatedDob = dob || (isMinor ? "01/01/2010" : "01/01/1980");
      await FakeDataStore.regenerateData({ dob: updatedDob });
      showToast({ style: Toast.Style.Success, title: "Données sauvegardées et régénérées !" });
      onClose();
    } catch {
      showToast({ style: Toast.Style.Failure, title: "Échec de la sauvegarde" });
    }
  };

  return (
    <Form
      actions={
        <ActionPanel>
          <Action title="Valider" onAction={handleSave} />
          <Action title="Annuler" onAction={onClose} />
        </ActionPanel>
      }
    >
      <Form.Checkbox
        id="isMinor"
        label="Générer une personne mineure"
        value={isMinor}
        onChange={(newValue) => {
          setIsMinor(newValue);
          setDob(newValue ? "01/01/2010" : "01/01/1980");
        }}
      />
      <Form.TextField id="dob" title="Date de naissance" placeholder="JJ/MM/AAAA" value={dob} onChange={setDob} />
    </Form>
  );
}
