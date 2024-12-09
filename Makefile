.PHONY: install run-backend run-frontend test clean

install:
	# Create and activate Python virtual environment
	python -m venv backend/venv
	. backend/venv/Scripts/activate && \
	cd backend && \
	pip install -r requirements.txt
	# Install frontend dependencies
	cd frontend && npm install

run-backend:
	. backend/venv/Scripts/activate && \
	cd backend && \
	export PYTHONPATH=. && \
	python app/main.py

run-frontend:
	cd frontend && npm run dev
clean:
	rm -rf backend/venv
	rm -rf frontend/node_modules
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete