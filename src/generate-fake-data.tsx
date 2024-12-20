import React, { useState } from "react";
import { List, ActionPanel, Action, Form, Toast, showToast } from "@raycast/api";

// Fonction pour générer un SSN aléatoire basé sur une date de naissance
function generateRandomSSN(dob?: string): string {
  const currentYear = new Date().getFullYear();
  const maxYear = dob ? parseInt(dob.split("-")[0]) : currentYear - 18;
  const minYear = maxYear - 81;

  const year = (maxYear % 100).toString().padStart(2, "0");
  const month = Math.floor(Math.random() * 12) + 1;
  const department = Math.floor(Math.random() * 95) + 1;
  const commune = Math.floor(Math.random() * 999) + 1;
  const order = Math.floor(Math.random() * 999) + 1;

  const baseSSN = `${Math.floor(Math.random() * 2) + 1}${year}${month.toString().padStart(2, "0")}${department
    .toString()
    .padStart(2, "0")}${commune.toString().padStart(3, "0")}${order.toString().padStart(3, "0")}`;

  const key = (97 - (parseInt(baseSSN, 10) % 97)).toString().padStart(2, "0");
  return `${baseSSN}${key}`;
}

// Fonction pour générer un IBAN et un BIC
function getRandomBankDetails() {
  const bankDetails = [
    { iban: "FR7630001007941234567890185", bic: "BDFEFRPP" },
    { iban: "FR7630004000031234567890143", bic: "BNPAFRPP" },
    { iban: "FR7630006000011234567890189", bic: "AGRIFRPP" },
    { iban: "FR7610107001011234567890129", bic: "CCBPFRPP" },
  ];
  const randomIndex = Math.floor(Math.random() * bankDetails.length);
  return bankDetails[randomIndex];
}

// Fonction pour générer un nom et un prénom aléatoires
function getRandomName() {
  const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Eve"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones"];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

export default function Command() {
  const [dob, setDob] = useState<string | undefined>();
  const [ssn, setSsn] = useState<string>(generateRandomSSN());
  const [bankDetails, setBankDetails] = useState(getRandomBankDetails());
  const [name, setName] = useState(getRandomName());

  const regenerateData = () => {
    setSsn(generateRandomSSN(dob));
    setBankDetails(getRandomBankDetails());
    setName(getRandomName());
    showToast({ style: Toast.Style.Success, title: "Données régénérées !" });
  };

  return (
    <List>
      <List.Section title="Informations Générées">
        <List.Item
          title="Nom et Prénom"
          subtitle={name}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={name} title="Copier le nom et prénom" />
            </ActionPanel>
          }
        />
        <List.Item
          title="Numéro de Sécurité Sociale"
          subtitle={ssn}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={ssn} title="Copier le SSN" />
            </ActionPanel>
          }
        />
        <List.Item
          title="IBAN"
          subtitle={bankDetails.iban}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={bankDetails.iban} title="Copier l'IBAN" />
            </ActionPanel>
          }
        />
        <List.Item
          title="BIC"
          subtitle={bankDetails.bic}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard content={bankDetails.bic} title="Copier le BIC" />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Paramètres">
        <Form.TextField id="dob" title="Date de naissance" placeholder="YYYY-MM-DD" value={dob} onChange={setDob} />
        <ActionPanel>
          <Action title="Régénérer les données" onAction={regenerateData} />
        </ActionPanel>
      </List.Section>
    </List>
  );
}
