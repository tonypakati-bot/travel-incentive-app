import express from 'express';
import * as tripController from '../controllers/tripController.mjs';
import * as photoController from '../controllers/photoController.mjs';
import * as documentController from '../controllers/documentController.mjs';
import * as privacyController from '../controllers/privacyController.mjs';
import auth from '../middleware/auth.mjs';

const router = express.Router();

// Trip Routes
router.get('/trip', tripController.getTripData);
router.get('/travel-info', tripController.getTravelInfo);
router.put('/trip', auth, tripController.updateTripData);
router.put('/travel-info', auth, tripController.updateTravelInfo);

// Announcement Routes
router.post('/announcements', auth, tripController.addAnnouncement);
router.delete('/announcements/:id', auth, tripController.deleteAnnouncement);

// Document Routes
router.get('/trip/documents', auth, photoController.getDocuments);
router.get('/documents/legal', auth, documentController.getLegalDocuments);
router.get('/documents/me', auth, documentController.getUserDocuments);
// Privacy policies
router.get('/documents/privacy', auth, privacyController.listPrivacyPolicies);
router.post('/documents/privacy', auth, privacyController.createPrivacyPolicy);
router.get('/documents/privacy/:id', auth, privacyController.getPrivacyPolicy);
router.patch('/documents/privacy/:id', auth, privacyController.updatePrivacyPolicy);
router.delete('/documents/privacy/:id', auth, privacyController.deletePrivacyPolicy);

// Registration Routes
router.post('/trip/registration', auth, tripController.submitRegistration);
router.get('/trip/registration/me', auth, tripController.getUserRegistration);

// Admin Routes
router.get('/admin/registrations/count', auth, tripController.countRegistrations);
router.get('/admin/users/count', auth, tripController.countUsers);
router.get('/admin/registrations', auth, tripController.getAllRegistrations);

// Photo Routes
router.post('/trip/photos', auth, photoController.uploadPhoto);
router.post('/trip/photos/:id/like', auth, photoController.togglePhotoLike);
router.delete('/trip/photos/:id', auth, photoController.deletePhoto);

// Config Routes
router.get('/config', auth, tripController.getConfig);

export default router;