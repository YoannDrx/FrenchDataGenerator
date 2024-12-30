import { useEffect, useState } from "react";
import { List, ActionPanel, Action, Form, showToast, Toast } from "@raycast/api";
import { useSubscribeObservable } from "./helpers/rx.helper";
import { FakeDataStore } from "./store";

// Fonction pour générer une date aléatoire entre deux âges
const generateRandomDob = (minAge: number, maxAge: number): string => {
  const today = new Date();
  const startYear = today.getFullYear() - maxAge;
  const endYear = today.getFullYear() - minAge;
  const randomYear = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
  const randomMonth = Math.floor(Math.random() * 12); // Mois aléatoire
  const randomDay = Math.floor(Math.random() * 28) + 1; // Jour aléatoire (simplifié)
  const randomDate = new Date(randomYear, randomMonth, randomDay);
  return randomDate.toISOString().split("T")[0].split("-").reverse().join("/"); // Format JJ/MM/AAAA
};

// Fonction pour calculer l'âge
const calculateAge = (dob: string | null): number | null => {
  if (!dob) return null;
  const birthDate = new Date(dob.split("/").reverse().join("-"));
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const isBeforeBirthday = today < new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (isBeforeBirthday) age -= 1;
  return age;
};

export default function Command() {
  const { data: fakeData } = useSubscribeObservable(FakeDataStore.fakeData$);
  const { data: isAddressLoading } = useSubscribeObservable(FakeDataStore.isAddressLoading$);

  const [isEditing, setIsEditing] = useState(false);
  const [editedDob, setEditedDob] = useState(fakeData?.dob || "");
  const [isMinorChecked, setIsMinorChecked] = useState(false);
  const [isMajorChecked, setIsMajorChecked] = useState(false);

  const age = calculateAge(editedDob);

  useEffect(() => {
    if (!fakeData?.dob || !fakeData?.name || !fakeData?.ssn || !fakeData?.bankDetails || !fakeData?.address) {
      FakeDataStore.regenerateData();
    }
  }, [fakeData]);

  const handleCheckboxChange = (type: "minor" | "major") => {
    if (type === "minor") {
      setEditedDob(generateRandomDob(0, 12)); // Générer une date aléatoire pour un mineur
      setIsMinorChecked(true);
      setIsMajorChecked(false);
    } else if (type === "major") {
      setEditedDob(generateRandomDob(18, 99)); // Générer une date aléatoire pour un majeur
      setIsMajorChecked(true);
      setIsMinorChecked(false);
    }
  };

  const handleDobEdit = (value: string) => {
    setEditedDob(value);
    setIsMinorChecked(false); // Désactiver les checkboxes si une date manuelle est saisie
    setIsMajorChecked(false);
  };

  const handleSaveAndRegenerate = async () => {
    try {
      const updatedDob = editedDob || fakeData?.dob || generateRandomDob(18, 99); // Date par défaut pour un majeur
      await FakeDataStore.regenerateData({ dob: updatedDob });
      showToast({ style: Toast.Style.Success, title: "Données sauvegardées et régénérées !" });
      setIsEditing(false); // Sortir du mode édition
    } catch (error) {
      showToast({ style: Toast.Style.Failure, title: "Échec de la mise à jour des données" });
    }
  };

  if (isEditing) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action title="Valider" onAction={handleSaveAndRegenerate} />
            <Action title="Annuler" onAction={() => setIsEditing(false)} />
          </ActionPanel>
        }
      >
        <Form.Checkbox
          id="minor"
          label="Générer une personne mineure"
          value={isMinorChecked}
          onChange={() => handleCheckboxChange("minor")}
        />
        <Form.Checkbox
          id="major"
          label="Générer une personne majeure"
          value={isMajorChecked}
          onChange={() => handleCheckboxChange("major")}
        />
        <Form.Description
          title="Date de naissance"
          text={`Date : ${editedDob || "Non définie"}${age !== null ? ` | Âge : ${age} ans` : ""}`}
        />
        <Form.TextField id="dob" placeholder="JJ/MM/AAAA" value={editedDob} onChange={handleDobEdit} />
      </Form>
    );
  }

  const isMinor = calculateAge(fakeData?.dob) < 18;

  return (
    <List>
      <List.Section title="Informations Générées">
        <List.Item title="Nom et Prénom" subtitle={fakeData?.name?.name || "Nom non défini"} />
        <List.Item title="Numéro de Sécurité Sociale" subtitle={fakeData?.ssn || "SSN non défini"} />
        <List.Item title="IBAN" subtitle={fakeData?.bankDetails?.iban || "IBAN non défini"} />
        <List.Item
          title="Adresse"
          subtitle={isAddressLoading ? "Chargement..." : fakeData?.address || "Adresse non définie"}
        />
      </List.Section>
      <List.Section title="Actions">
        <List.Item
          title="Modifier la date de naissance"
          subtitle={`Date : ${fakeData?.dob || "Non définie"}${
            isMinor !== null ? ` | ${isMinor ? "Mineur" : "Majeur"}` : ""
          }`}
          actions={
            <ActionPanel>
              <Action title="Modifier" onAction={() => setIsEditing(true)} />
            </ActionPanel>
          }
        />
        <List.Item
          title="Régénérer les données"
          actions={
            <ActionPanel>
              <Action title="Régénérer" onAction={() => FakeDataStore.regenerateData()} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
