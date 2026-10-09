// Icônes Hugeicons — source de vérité unique pour les icônes du projet.
// Toutes les icônes viennent de @hugeicons/core-free-icons (6000+ icônes, MIT).
// Utilisées via le composant <HugeiconsIcon> de @hugeicons/react.
//
// Usage :
//   import { HugeiconsIcon } from "@hugeicons/react";
//   import { Activity01Icon } from "@/lib/icons";
//   <HugeiconsIcon icon={Activity01Icon} className="h-5 w-5 text-primary" />

import type { IconSvgElement } from "@hugeicons/react";
import {
  Activity01Icon as Activity,
  Database01Icon as Database,
  Package01Icon as Package,
  CreditCardAcceptIcon as CreditCard,
  TrendingUpIcon as TrendingUp,
  TrendingDownIcon as TrendingDown,
  BarChartIcon as BarChart3,
  Clock01Icon as Clock,
  FileTextIcon as FileText,
  BoxIcon as Box,
  Wallet01Icon as Wallet,
  Alert02Icon as AlertTriangle,
  ReceiptDollarIcon as Receipt,
  Shield01Icon as Shield,
  Menu01Icon as Menu,
  ChevronRightIcon as ChevronRight,
  TrophyIcon as Trophy,
  CheckIcon as Check,
  CheckmarkCircle01Icon as CheckCircle2,
  Target01Icon as Target,
  GaugeIcon as Gauge,
  HistoryIcon as History,
  MinusIcon as Minus,
  PercentCircleIcon as Percent,
  Coins01Icon as Coins,
  PiggyBankIcon as PiggyBank,
  ScaleIcon as Scale,
  ShoppingCart01Icon as ShoppingCart,
  SaladIcon as Salad,
  BeefIcon as Beef,
  LandmarkIcon as Landmark,
  ArrowUpRight01Icon as ArrowUpRight,
  ArrowLeft01Icon as ArrowLeft,
  ArrowRight01Icon as ArrowRight,
  BarChartHorizontalIcon as BarChartHorizontal,
  PieChart01Icon as PieChart,
  Settings01Icon as Settings,
  PrinterIcon as Printer,
  Download01Icon as Download,
  PlusSignIcon as Plus,
  TrashIcon as Trash,
  PencilEdit01Icon as Pencil,
  Cancel01Icon as X,
  AlertCircleIcon as AlertCircle,
  DashboardBrowsingIcon as LayoutGrid,
  ViewIcon as Eye,
  Calendar01Icon as Calendar,
  CalendarClockIcon as CalendarClock,
  HardDriveIcon as HardDrive,
  InformationCircleIcon as Info,
  MapIcon as Map,
  MapPinIcon as MapPin,
  QrCode01Icon as QrCode,
  Search01Icon as Search,
  UserIcon as User,
  Layers01Icon as Layers,
  ArrowExpand01Icon as Maximize2,
  ArrowReloadHorizontalIcon as RotateCw,
  Compass01Icon as Navigation,
  Logout01Icon as Logout,
  LockIcon as Lock,
  EyeOffIcon as EyeOff,
  Sun01Icon as Sun,
  Moon02Icon as Moon,
  SparklesIcon as Sparkles,
  BoltIcon as Bolt,
  Wifi01Icon as Wifi,
  ChevronDownIcon as ChevronDown,
  ChevronUpIcon as ChevronUp,
} from "@hugeicons/core-free-icons";

// Export groupé pour usage direct
export {
  Activity, Database, Package, CreditCard, TrendingUp, TrendingDown,
  BarChart3, Clock, FileText, Box, Wallet, AlertTriangle, Receipt,
  Shield, Menu, ChevronRight, Trophy, Check, CheckCircle2, Target,
  Gauge, History, Minus, Percent, Coins, PiggyBank, Scale,
  ShoppingCart, Salad, Beef, Landmark, ArrowUpRight, ArrowLeft, ArrowRight,
  BarChartHorizontal, PieChart, Settings, Printer, Download, Plus, Trash, Pencil, X,
  AlertCircle, LayoutGrid, Eye, Calendar, CalendarClock, HardDrive, Info,
  Map, MapPin, QrCode, Search, User,
  Layers, Maximize2, RotateCw, Navigation,
  Logout,
  Lock,
  EyeOff,
  Sun, Moon, Sparkles, Bolt,
  Wifi, ChevronDown, ChevronUp,
};

// Type utilitaire pour les props d'icône
export type { IconSvgElement };

// Helper : wrapper pour utiliser une icône Hugeicons avec la même API que Lucide
// (className, size via className h-/w-)
export { HugeiconsIcon } from "@hugeicons/react";
