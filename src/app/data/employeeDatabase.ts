/** Mock Workday employee records — keyed by badge number */
export interface WorkdayRecord {
  badge: string;
  name: string;
  phone: string;
  gender: string;
  address: string;
  age: string;
  hire_date: string;   // yyyy-MM-dd
  status: string;
  department: string;
  division: string;
  division_supervisor: string;
  division_work: string;
  cost_center: string;
  service_years: string;
  service_months: string;
  service_days: string;
  is_student: boolean;
}

export const EMPLOYEE_DB: Record<string, WorkdayRecord> = {
  '10001': {
    badge: '10001', name: 'Marcus Johnson',
    phone: '(214) 555-0142', gender: 'Male',
    address: '4821 Maple Ave, Dallas TX 75204',
    age: '38', hire_date: '2015-03-12',
    status: 'Active', department: 'Operations',
    division: 'North Dallas', division_work: 'Bus Operator',
    division_supervisor: 'Maria Chen',
    cost_center: 'CC-4021',
    service_years: '4', service_months: '2', service_days: '8',
    is_student: false,
  },
  '10002': {
    badge: '10002', name: 'Sarah Chen',
    phone: '(972) 555-0307', gender: 'Female',
    address: '2309 Elm St, Dallas TX 75226',
    age: '31', hire_date: '2019-07-08',
    status: 'Active', department: 'Operations',
    division: 'Downtown', division_work: 'Rail Operator',
    division_supervisor: 'Anthony Clark',
    cost_center: 'CC-5012',
    service_years: '2', service_months: '11', service_days: '3',
    is_student: false,
  },
  '10003': {
    badge: '10003', name: 'David Rodriguez',
    phone: '(469) 555-0215', gender: 'Male',
    address: '789 Oak Blvd, Garland TX 75040',
    age: '46', hire_date: '2008-11-01',
    status: 'Active', department: 'Operations',
    division: 'East Dallas', division_work: 'Senior Bus Operator',
    division_supervisor: 'Brenda Lewis',
    cost_center: 'CC-4022',
    service_years: '8', service_months: '0', service_days: '14',
    is_student: false,
  },
  '10004': {
    badge: '10004', name: 'Lisa Thompson',
    phone: '(214) 555-0489', gender: 'Female',
    address: '5530 Preston Rd, Plano TX 75024',
    age: '42', hire_date: '2012-06-15',
    status: 'Active', department: 'Operations',
    division: 'North Dallas', division_work: 'Transit Supervisor',
    division_supervisor: 'Maria Chen',
    cost_center: 'CC-3001',
    service_years: '6', service_months: '7', service_days: '22',
    is_student: false,
  },
  '10005': {
    badge: '10005', name: 'James Williams',
    phone: '(972) 555-0098', gender: 'Male',
    address: '1147 Cedar St, Irving TX 75061',
    age: '29', hire_date: '2022-02-28',
    status: 'Probationary', department: 'Operations',
    division: 'West Dallas', division_work: 'Bus Operator',
    division_supervisor: 'Tyler Brooks',
    cost_center: 'CC-4021',
    service_years: '0', service_months: '4', service_days: '5',
    is_student: false,
  },
  '10006': {
    badge: '10006', name: 'Maya Patel',
    phone: '(469) 555-0364', gender: 'Female',
    address: '3310 Greenville Ave, Dallas TX 75206',
    age: '35', hire_date: '2017-09-20',
    status: 'Active', department: 'Maintenance',
    division: 'South Dallas', division_work: 'Non-Revenue Driver',
    division_supervisor: 'Renee Foster',
    cost_center: 'CC-6030',
    service_years: '3', service_months: '1', service_days: '17',
    is_student: false,
  },
  '10007': {
    badge: '10007', name: 'Robert Davis',
    phone: '(214) 555-0771', gender: 'Male',
    address: '826 Buckner Blvd, Dallas TX 75217',
    age: '52', hire_date: '2004-04-03',
    status: 'Active', department: 'Maintenance',
    division: 'East Dallas', division_work: 'Maintenance Technician II',
    division_supervisor: 'Brenda Lewis',
    cost_center: 'CC-6015',
    service_years: '12', service_months: '9', service_days: '0',
    is_student: false,
  },
  '10008': {
    badge: '10008', name: 'Angela Martinez',
    phone: '(972) 555-0543', gender: 'Female',
    address: '441 Mockingbird Ln, Dallas TX 75205',
    age: '27', hire_date: '2023-01-09',
    status: 'Probationary', department: 'Operations',
    division: 'Downtown', division_work: 'Bus Operator',
    division_supervisor: 'Anthony Clark',
    cost_center: 'CC-4023',
    service_years: '0', service_months: '2', service_days: '11',
    is_student: false,
  },

  // ── Prototype persona records ─────────────────────────────────────────────
  '90001': {
    badge: '90001', name: 'John Doe',
    phone: '(214) 555-0100', gender: 'Male',
    address: '1200 Pacific Ave, Dallas TX 75201',
    age: '34', hire_date: '2018-06-04',
    status: 'Active', department: 'Operations',
    division: 'North Dallas', division_work: 'Bus Operator',
    division_supervisor: 'Maria Chen',
    cost_center: 'CC-4021',
    service_years: '5', service_months: '10', service_days: '20',
    is_student: false,
  },
  '90002': {
    badge: '90002', name: 'Maria Chen',
    phone: '(214) 555-0200', gender: 'Female',
    address: '825 Commerce St, Dallas TX 75202',
    age: '41', hire_date: '2011-03-15',
    status: 'Active', department: 'Operations',
    division: 'Downtown', division_work: 'Transit Supervisor',
    division_supervisor: 'Anthony Clark',
    cost_center: 'CC-3001',
    service_years: '13', service_months: '1', service_days: '9',
    is_student: false,
  },
  '90003': {
    badge: '90003', name: 'David Park',
    phone: '(214) 555-0300', gender: 'Male',
    address: '500 N Akard St, Dallas TX 75201',
    age: '48', hire_date: '2006-08-21',
    status: 'Active', department: 'Operations',
    division: 'Downtown', division_work: 'Program Manager',
    division_supervisor: 'Anthony Clark',
    cost_center: 'CC-2005',
    service_years: '17', service_months: '8', service_days: '3',
    is_student: false,
  },
};