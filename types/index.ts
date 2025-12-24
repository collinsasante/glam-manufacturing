export interface Supplier {
  id: string;
  fields: {
    'Supplier ID': string;
    'Supplier Name': string;
    'Contact Person'?: string;
    'Phone'?: string;
    'Email'?: string;
    'Address'?: string;
    'Website'?: string;
    'Supplier Type'?: 'Factory' | 'Trading Company';
    'Status'?: 'Active' | 'Inactive';
    'Date Created'?: string;
  };
}

export interface RawMaterial {
  id: string;
  fields: {
    'Material Name': string;
    'Specification'?: 'Clear' | 'Translucent' | 'Color';
    'Unit of Measurement'?: string;
    'Unit Cost'?: number;
    'Total Amount'?: number;
    'Current Stock'?: number;
    'Available Stock'?: number;
    'Available Amount'?: number;
    'Suppliers'?: string[];
    'Storage Location'?: string[];
  };
}

export interface StockMovement {
  id: string;
  fields: {
    'Batch Number': string;
    'Transaction Type'?: 'In' | 'Out';
    'Reason'?: 'New Stock' | 'Stock Adjustment' | 'Manufacturing Order';
    'Quantity'?: number;
    'Signed Quantity'?: number;
    'Material'?: string[];
    'Date'?: string;
    'Unit Cost'?: number;
    'Total Value'?: number;
    'From Warehouse'?: string[];
    'To Warehouse'?: string[];
    'Documentation'?: string;
  };
}

export interface Warehouse {
  id: string;
  fields: {
    'Warehouse Name': string;
    'Address'?: string;
    'Phone Number'?: string;
    'Officer in Charge'?: string;
    'Available Quantity'?: number;
    'Total In'?: number;
    'Total Out'?: number;
  };
}

export interface StockTransfer {
  id: string;
  fields: {
    'Batch Number': string;
    'Date'?: string;
    'Material'?: string[];
    'Quantity Transferred'?: number;
    'From Warehouse'?: string[];
    'To Warehouse'?: string[];
    'Status'?: string;
    'Requested by'?: string[];
    'Remarks'?: string;
  };
}

export interface FinishedGood {
  id: string;
  fields: {
    'Product Name': string;
    'Available Quantity'?: number;
    'Pack Size/Notes'?: string;
    'Price'?: number;
    'Status'?: 'Available' | 'Out of Stock' | 'Reserved' | 'Pending';
  };
}

export interface TeamMember {
  id: string;
  fields: {
    'Name': string;
    'Email'?: string;
    'Phone'?: string;
    'Role'?: string;
    'Department'?: string;
  };
}

export interface Delivery {
  id: string;
  fields: {
    'Delivery ID': string;
    'Date'?: string;
    'Rider'?: string[];
    'Status'?: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
    'Total Stops'?: number;
  };
}
