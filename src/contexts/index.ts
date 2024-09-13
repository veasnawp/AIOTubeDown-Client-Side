import { useContext } from "react";
import { AuthContext } from "./auth";
import { DownloadRecordContext } from "./download-data";
import { LicenseRecordContext } from "./license-records";
import { FinancialRecordContext } from "./financial-records";
import { ItemsDragAndDropContext } from "./itemsDragAndDrop";

export const useDownload = () => {
  const context = useContext<Prettify<DownloadRecordContextProps> | undefined>(
    DownloadRecordContext
  );

  if (!context) {
    throw new Error(
      "useDownload must be used within a DownloadRecordProvider"
    );
  }
  return context;
};

export const useItems = () => {
  const context = useContext<ItemsDragAndDropContextProps | undefined>(
    ItemsDragAndDropContext
  );

  if (!context) {
    throw new Error(
      "useItems must be used within a AuthProvider"
    );
  }
  return context;
};

export const useAuth = () => {
  const context = useContext<AuthContextProps | undefined>(
    AuthContext
  );

  if (!context) {
    throw new Error(
      "useAuth must be used within a AuthProvider"
    );
  }
  return context;
};

export const useLicenseRecord = () => {
  const context = useContext<LicenseRecordContextProps | undefined>(
    LicenseRecordContext
  );

  if (!context) {
    throw new Error(
      "useFinancialRecord must be used within a FinancialRecordProvider"
    );
  }
  return context;
};

export const useFinancialRecord = () => {
  const context = useContext<FinancialRecordContextProps | undefined>(
    FinancialRecordContext
  );

  if (!context) {
    throw new Error(
      "useFinancialRecord must be used within a FinancialRecordProvider"
    );
  }
  return context;
};


export const categories = [
  'Business',
  'Household',
  'Savings',
  'Loans',
] as const;
export const childCategories = {
  Business: [
    "Items & stock",
    "Bills & fees",
    "Pay my worker",
    "Repair & maintenance",
    "Machinery & Equipment",
    "Phone & Internet",
    "Insurance",
    "Transport",
    "Other"
  ],
  Household: [
    "Items & stock",
    "Bills & fees",
    "Health & medicine",
    "Education",
    "House items",
    "House improvements",
    "Phone & Internet",
    "Transport",
    "Clothes",
    "Family allowances",
    "Gift as cash",
    "Gifts",
    "Celebrations & events",
    "Personal shopping",
    "Insurance",
    "Other"
  ],
  Savings: ["Cash savings", "Tong Tin"],
  Loans: ["Pay someone back", "Loan repayment", "Tong Tin"],
} as const;

export const paymentMethodData = ["Cash", "Credit Card", "Bank Transfer"] as const;