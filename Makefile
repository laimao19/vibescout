.PHONY: install run-backend run-frontend test clean

# Install dependencies for backend and frontend
install:
	python -m venv backend/venv
	backend/venv/Scripts/activate && \
	cd backend && \
	pip install -r requirements.txt
	cd frontend && npm install

# Run the backend server
run-backend:
	cmd /C "cd backend && call ../backend/venv/Scripts/activate && set PYTHONPATH=. && python app/main.py"

# Run the frontend server
run-frontend:
	cd frontend && npm run dev

# Clean up virtual environment, node_modules, and compiled files
clean:
	rm -rf backend/venv
	rm -rf frontend/node_modules
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
