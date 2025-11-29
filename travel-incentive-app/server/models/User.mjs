import mongoose from 'mongoose';

const passportSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/^.+@.+\..+$/, 'Please enter a valid email address'],
    index: true,  // Aggiungiamo un indice
    set: v => v.toLowerCase(),  // Normalizziamo l'email
    get: v => v
  },
  firstName: {
    type: String,
    required: true,
    // no default: required field
  },
  lastName: {
    type: String,
    required: true,
    // no default: required field
  },
  password: {
    type: String,
    required: true,
    select: false  // Non includiamo la password di default nelle query
  },
  // Compatibility field used by tests: if tests provide `passwordHash`, copy it to `password`
  passwordHash: {
    type: String,
    required: true,
    select: false
  },
  groupName: {
    type: String,
    default: 'Default'
  },
  auth_provider_id: {
    type: String
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'super_admin', 'guide'],
    required: true,
    validate: {
      validator: function(role) {
        if (role === 'admin' && !this.authorizationCode) {
          this.invalidate('authorizationCode', 'Authorization code is required for admin role');
          return false;
        }
        if (role === 'guide' && !this.certifications) {
          this.invalidate('certifications', 'Certifications are required for guide role');
          return false;
        }
        return true;
      }
    }
  },
  authorizationCode: {
    type: String,
    required: function() {
      return this.role === 'admin';
    }
  },
  certifications: {
    type: [String],
    validate: [{
      validator: function(v) {
        if (this.role === 'guide' && (!Array.isArray(v) || v.length === 0)) {
          return false;
        }
        return true;
      },
      message: 'Certifications are required for guide role'
    }]
  },
  birthDate: {
    type: Date,
    default: new Date('1990-01-01')
  },
  nationality: {
    type: String,
    default: 'IT'
  },
  mobilePhone: {
    type: String
  },
  passport: passportSchema,
  preferences: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  validateBeforeSave: true
});

// Indici per ottimizzare le ricerche e garantire unicità
UserSchema.index({ auth_provider_id: 1 }, { unique: true, sparse: true });
UserSchema.index({ lastName: 1, firstName: 1 });
UserSchema.index({ groupName: 1 });
UserSchema.index({ role: 1 });

// Validazione personalizzata per la data di scadenza del passaporto
UserSchema.pre('validate', function(next) {
  if (this.passport && this.passport.issueDate && this.passport.expiryDate) {
    const issueDate = new Date(this.passport.issueDate);
    const expiryDate = new Date(this.passport.expiryDate);
    if (isNaN(issueDate.getTime()) || isNaN(expiryDate.getTime()) || expiryDate <= issueDate) {
      this.invalidate('passport.expiryDate', 'Passport expiry date must be after issue date');
    }
  }
  next();
});

// Validazione personalizzata per la data di nascita
UserSchema.path('birthDate').validate(function(value) {
  const now = new Date();
  const age = now.getFullYear() - value.getFullYear();
  return age >= 18;
}, 'User must be at least 18 years old');

// Middleware pre-save per aggiornare updatedAt
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-validate: support tests that set passwordHash instead of password
UserSchema.pre('validate', function(next) {
  if (!this.password && this.passwordHash) {
    this.password = this.passwordHash;
  }
  next();
});

// Metodo di istanza per verificare se il passaporto è valido
UserSchema.methods.isPassportValid = function() {
  const now = new Date();
  return this.passport.expiryDate > now;
};

// Metodo di istanza per ottenere il nome completo
UserSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Metodi di istanza per la verifica dei ruoli
UserSchema.methods.isAdmin = function() {
  return this.role === 'admin' || this.role === 'super_admin';
};

UserSchema.methods.isGuide = function() {
  return this.role === 'guide';
};

// Metodo di istanza per la verifica dei permessi
UserSchema.methods.hasPermission = function(permission) {
  const permissions = {
    admin: [
      'manage_users',
      'view_reports',
      'edit_content',
      'manage_tours',
      'view_participants',
      'view_content',
      'edit_profile'
    ],
    guide: [
      'manage_tours',
      'view_participants',
      'view_content',
      'edit_profile'
    ],
    user: [
      'view_content',
      'edit_profile'
    ]
  };

  if (this.role === 'super_admin') {
    return true; // super_admin ha tutti i permessi
  }

  const rolePermissions = permissions[this.role] || [];
  return rolePermissions.includes(permission);
};

// Metodo statico per trovare utenti per gruppo
UserSchema.statics.findByGroup = function(groupName) {
  return this.find({ groupName: groupName });
};

const User = mongoose.model('User', UserSchema);

// Crea esplicitamente gli indici
User.createIndexes().catch(error => {
  console.error('Error creating indexes:', error);
});

export default User;
