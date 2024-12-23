import { List, ActionPanel, Action } from "@raycast/api";

type GeneratedListProps = {
  name: string;
  ssn: string;
  iban: string;
  bic: string;
};

export function GeneratedList({ name, ssn, iban, bic }: GeneratedListProps) {
  return (
    <List.Section title="Informations Générées">
      <List.Item
        title="Nom et Prénom"
        subtitle={name}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard content={name} title="Copier le Nom et prénom" />
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
        subtitle={iban}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard content={iban} title="Copier L'IBAN" />
          </ActionPanel>
        }
      />
      <List.Item
        title="BIC"
        subtitle={bic}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard content={bic} title="Copier le BIC" />
          </ActionPanel>
        }
      />
    </List.Section>
  );
}
