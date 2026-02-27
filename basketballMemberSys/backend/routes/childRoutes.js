
import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import prisma from '../services/prisma.js';

const router = express.Router();

// Admin: Get all children
router.get('/all', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const children = await prisma.child.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    res.json(children);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch children.', error: error.message });
  }
});

// Admin: Create a new child
router.post('/', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { name, dateOfBirth, ageGroup, parentId, skillLevel } = req.body;
    if (!name || !ageGroup || !parentId) {
      return res.status(400).json({ message: 'Name, age group, and parent ID are required.' });
    }
    const newChild = await prisma.child.create({
      data: {
        name,
        dateOfBirth,
        ageGroup,
        parentId: parseInt(parentId),
        skillLevel,
      },
    });
    res.status(201).json(newChild);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create child.', error: error.message });
  }
});

// Admin: Update a child's details
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dateOfBirth, ageGroup, parentId, skillLevel } = req.body;
    const updatedChild = await prisma.child.update({
      where: { id: parseInt(id) },
      data: {
        name,
        dateOfBirth,
        ageGroup,
        parentId: parentId ? parseInt(parentId) : undefined,
        skillLevel,
      },
    });
    res.json(updatedChild);
  } catch (error) {
    res.status(500).json({ message: "Failed to update child's details.", error: error.message });
  }
});

// Admin: Delete a child
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.child.delete({
      where: { id: parseInt(id) },
    });
    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete child.', error: error.message });
  }
});

export default router;