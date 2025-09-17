#!/usr/bin/env python3
"""
Test script for the upgraded chatbot functionality
"""
import requests
import json
import time

def test_text_chat():
    """Test text-based chat"""
    print("Testing text chat...")
    
    url = "http://localhost:5001/api/v1/chat"
    data = {
        "text": "Hello, how are you?",
        "organisation_id": 1,
        "project_id": 1
    }
    
    try:
        response = requests.post(url, data=data)
        response.raise_for_status()
        
        result = response.json()
        print(f"✅ Text chat successful:")
        print(f"   Answer: {result['answer']}")
        print(f"   Is Voice: {result['is_voice']}")
        print(f"   Has Audio URL: {result.get('audio_url') is not None}")
        return True
    except Exception as e:
        print(f"❌ Text chat failed: {e}")
        return False

def test_health():
    """Test health endpoint"""
    print("Testing health endpoint...")
    
    try:
        response = requests.get("http://localhost:5001/api/v1/health/")
        response.raise_for_status()
        
        result = response.json()
        print(f"✅ Health check successful: {result}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing upgraded chatbot functionality...")
    print("=" * 50)
    
    # Test health first
    if not test_health():
        print("❌ Backend not running. Please start the backend server first.")
        return
    
    print()
    
    # Test text chat
    if test_text_chat():
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed.")

if __name__ == "__main__":
    main()
