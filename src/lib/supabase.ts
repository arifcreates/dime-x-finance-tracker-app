import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          preferences: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          phone?: string | null
          preferences?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          preferences?: any
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'savings' | 'current' | 'cash' | 'investment'
          balance: number
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'savings' | 'current' | 'cash' | 'investment'
          balance: number
          currency: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'savings' | 'current' | 'cash' | 'investment'
          balance?: number
          currency?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          date: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category: string
          account: string
          status: 'completed' | 'pending' | 'cancelled'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category: string
          account: string
          status: 'completed' | 'pending' | 'cancelled'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          description?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          account?: string
          status?: 'completed' | 'pending' | 'cancelled'
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          client_id: string
          invoice_number: string
          date: string
          due_date: string
          amount: number
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          items: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          invoice_number: string
          date: string
          due_date: string
          amount: number
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          items: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          invoice_number?: string
          date?: string
          due_date?: string
          amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          items?: any
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string
          address: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone: string
          address: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          updated_at?: string
        }
      }
      emis: {
        Row: {
          id: string
          user_id: string
          name: string
          principal: number
          interest_rate: number
          tenure: number
          monthly_amount: number
          remaining_balance: number
          next_due_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          principal: number
          interest_rate: number
          tenure: number
          monthly_amount: number
          remaining_balance: number
          next_due_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          principal?: number
          interest_rate?: number
          tenure?: number
          monthly_amount?: number
          remaining_balance?: number
          next_due_date?: string
          updated_at?: string
        }
      }
      credit_cards: {
        Row: {
          id: string
          user_id: string
          name: string
          credit_limit: number
          current_balance: number
          minimum_due: number
          due_date: string
          interest_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          credit_limit: number
          current_balance: number
          minimum_due: number
          due_date: string
          interest_rate: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          credit_limit?: number
          current_balance?: number
          minimum_due?: number
          due_date?: string
          interest_rate?: number
          updated_at?: string
        }
      }
      recurring_payments: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          frequency: 'monthly' | 'yearly'
          next_date: string
          category: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          frequency: 'monthly' | 'yearly'
          next_date: string
          category: string
          is_active: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          frequency?: 'monthly' | 'yearly'
          next_date?: string
          category?: string
          is_active?: boolean
          updated_at?: string
        }
      }
    }
  }
}